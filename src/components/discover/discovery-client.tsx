"use client";

import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Clock,
  EyeOff,
  Heart,
  Loader2,
  PauseCircle,
  Plus,
  RotateCcw,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameArtwork } from "@/components/games/game-artwork";
import {
  RatingDialog,
  type RatingRecommendationChoice,
} from "@/components/games/rating-dialog";
import type { GameSummary } from "@/lib/games/types";
import {
  STATUS_PROMPTS,
  type GameStatus,
  type LibraryEntry,
} from "@/lib/types";
import { getReleaseYear } from "@/lib/utils";

const actionIcons: Record<
  GameStatus,
  React.ComponentType<{ className?: string }>
> = {
  played: Check,
  playing: Clock,
  want_to_play: Plus,
  dropped: PauseCircle,
  not_interested: EyeOff,
  skipped: RotateCcw,
};

const swipeToStatus = {
  right: "played",
  left: "skipped",
  up: "want_to_play",
  down: "playing",
} as const satisfies Record<string, GameStatus>;

interface PostRatingResult {
  ratedGame: GameSummary;
  message: string;
  recommendations: RatingRecommendationChoice[];
}

interface PendingAnswer {
  gameTitle: string;
  status: GameStatus;
}

type SwipeDirection = keyof typeof swipeToStatus;

const swipeHints: Array<{
  direction: SwipeDirection;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  className: string;
}> = [
  {
    direction: "right",
    label: "Right: played",
    Icon: ArrowRight,
    className: "border-lime-300/40 bg-lime-300/10 text-lime-100",
  },
  {
    direction: "up",
    label: "Up: backlog",
    Icon: ArrowUp,
    className: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
  },
  {
    direction: "left",
    label: "Left: skip",
    Icon: ArrowLeft,
    className: "border-zinc-500 bg-zinc-800/80 text-zinc-200",
  },
  {
    direction: "down",
    label: "Down: playing",
    Icon: ArrowDown,
    className: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  },
];

export function DiscoveryClient({
  games,
  initialEntries,
  initialAnsweredSlugs,
  initialNextCursor,
}: {
  games: GameSummary[];
  initialEntries: LibraryEntry[];
  initialAnsweredSlugs: string[];
  initialNextCursor: number;
}) {
  const [candidateGames, setCandidateGames] = useState(games);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [answeredSlugs, setAnsweredSlugs] = useState(
    () =>
      new Set([
        ...initialAnsweredSlugs,
        ...initialEntries.map((entry) => entry.game.slug),
      ]),
  );
  const currentIndex = 0;
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingGame, setRatingGame] = useState<GameSummary | null>(null);
  const [postRatingResult, setPostRatingResult] =
    useState<PostRatingResult | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<PendingAnswer | null>(
    null,
  );
  const [busyStatus, setBusyStatus] = useState<GameStatus | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [discoveryExhausted, setDiscoveryExhausted] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState({ active: false, x: 0, y: 0 });
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const actionLockRef = useRef(false);

  const unansweredGames = useMemo(
    () => candidateGames.filter((game) => !answeredSlugs.has(game.slug)),
    [answeredSlugs, candidateGames],
  );
  const currentGame = unansweredGames[currentIndex] ?? null;
  const displayedGame =
    postRatingResult?.ratedGame ?? ratingGame ?? currentGame;

  const loadMoreDiscoveryGames = useCallback(
    async (force = false) => {
      if (loadingMore || (!force && discoveryExhausted)) {
        return;
      }

      setLoadingMore(true);
      setDiscoveryExhausted(false);
      setError(null);
      try {
        const response = await fetch(`/api/discover?cursor=${nextCursor}`);
        const payload = (await response.json()) as {
          games?: GameSummary[];
          nextCursor?: number;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load more games.");
        }

        const existingSlugs = new Set([
          ...candidateGames.map((game) => game.slug),
          ...answeredSlugs,
        ]);
        const incomingGames = (payload.games ?? []).filter((game) => {
          if (existingSlugs.has(game.slug)) {
            return false;
          }
          existingSlugs.add(game.slug);
          return true;
        });

        if (incomingGames.length) {
          setCandidateGames((current) => [...current, ...incomingGames]);
          setDiscoveryExhausted(false);
        } else if ((payload.games ?? []).length === 0) {
          setDiscoveryExhausted(true);
        }

        setNextCursor(payload.nextCursor ?? nextCursor + 4);
      } catch (error) {
        setDiscoveryExhausted(true);
        setError(
          error instanceof Error
            ? error.message
            : "Could not load more discovery games.",
        );
      } finally {
        setLoadingMore(false);
      }
    },
    [
      answeredSlugs,
      candidateGames,
      discoveryExhausted,
      loadingMore,
      nextCursor,
    ],
  );

  useEffect(() => {
    if (
      postRatingResult ||
      ratingOpen ||
      unansweredGames.length > 5 ||
      discoveryExhausted
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadMoreDiscoveryGames();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [
    discoveryExhausted,
    loadMoreDiscoveryGames,
    postRatingResult,
    ratingOpen,
    unansweredGames.length,
  ]);

  function cancelDrag() {
    startRef.current = null;
    setDrag({ active: false, x: 0, y: 0 });
  }

  function rememberEntry(entry: LibraryEntry) {
    rememberAnsweredSlug(entry.game.slug);
  }

  function rememberAnsweredSlug(gameSlug: string) {
    setAnsweredSlugs((current) => {
      const next = new Set(current);
      next.add(gameSlug);
      return next;
    });
  }

  function forgetAnsweredSlug(gameSlug: string) {
    setAnsweredSlugs((current) => {
      const next = new Set(current);
      next.delete(gameSlug);
      return next;
    });
  }

  function queueRecommendations(games: GameSummary[]) {
    if (!games.length) {
      return;
    }

    setCandidateGames((current) => {
      const recommendationSlugs = new Set(games.map((game) => game.slug));
      const withoutRecommendation = current.filter(
        (candidate) => !recommendationSlugs.has(candidate.slug),
      );
      const insertionIndex = Math.min(
        currentIndex,
        withoutRecommendation.length,
      );

      return [
        ...withoutRecommendation.slice(0, insertionIndex),
        ...games,
        ...withoutRecommendation.slice(insertionIndex),
      ];
    });
  }

  function chooseRecommendation(
    selectedGame: GameSummary,
    choices: RatingRecommendationChoice[],
  ) {
    queueRecommendations([
      selectedGame,
      ...choices
        .map((choice) => choice.game)
        .filter((game) => game.slug !== selectedGame.slug),
    ]);
    setPostRatingResult(null);
    setMessage(null);
  }

  async function updateStatus(status: GameStatus) {
    if (!currentGame || postRatingResult || actionLockRef.current) {
      return;
    }

    const selectedGame = currentGame;
    actionLockRef.current = true;
    setBusyStatus(status);
    setPendingAnswer({ gameTitle: selectedGame.title, status });
    setDrag({ active: false, x: 0, y: 0 });
    setError(null);
    setMessage(null);

    if (status === "played") {
      setRatingGame(selectedGame);
      setRatingOpen(true);
    } else {
      rememberAnsweredSlug(selectedGame.slug);
    }

    try {
      const response = await fetch("/api/user-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug: selectedGame.slug, status }),
      });
      const payload = (await response.json()) as {
        entry?: LibraryEntry | null;
        skipped?: boolean;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save your answer.");
      }
      if (payload.entry) {
        rememberEntry(payload.entry);
      } else if (payload.skipped) {
        rememberAnsweredSlug(currentGame.slug);
      } else {
        throw new Error(payload.error ?? "Could not save your answer.");
      }

      if (status === "played") {
        if (!payload.entry) {
          throw new Error("Could not start the rating flow.");
        }
      } else {
        setMessage(
          `${selectedGame.title} moved to ${STATUS_PROMPTS[status].toLowerCase()}.`,
        );
      }
    } catch (error) {
      if (status !== "played") {
        forgetAnsweredSlug(selectedGame.slug);
      }
      setError(
        error instanceof Error ? error.message : "Could not save your answer.",
      );
    } finally {
      setBusyStatus(null);
      setPendingAnswer(null);
      actionLockRef.current = false;
    }
  }

  async function toggleFavorite() {
    if (!currentGame || postRatingResult || actionLockRef.current) {
      return;
    }

    actionLockRef.current = true;
    setFavoriteBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/user-games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug: currentGame.slug, isFavorite: true }),
      });
      const payload = (await response.json()) as {
        entry?: LibraryEntry;
        error?: string;
      };
      if (!response.ok || !payload.entry) {
        throw new Error(payload.error ?? "Could not favorite this game.");
      }
      rememberEntry(payload.entry);
      setMessage(`${currentGame.title} added to favorites.`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not favorite this game.",
      );
    } finally {
      setFavoriteBusy(false);
      actionLockRef.current = false;
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (postRatingResult || ratingOpen || actionLockRef.current) {
      return;
    }

    if (
      event.target instanceof HTMLElement &&
      event.target.closest("button,a,input,textarea,select")
    ) {
      return;
    }

    startRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ active: true, x: 0, y: 0 });
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!startRef.current || !drag.active || actionLockRef.current) {
      return;
    }
    setDrag({
      active: true,
      x: event.clientX - startRef.current.x,
      y: event.clientY - startRef.current.y,
    });
  }

  function onPointerUp() {
    if (postRatingResult || ratingOpen || actionLockRef.current) {
      return;
    }

    if (!drag.active) {
      return;
    }

    const absX = Math.abs(drag.x);
    const absY = Math.abs(drag.y);
    const threshold = 90;
    cancelDrag();

    if (absX < threshold && absY < threshold) {
      return;
    }

    if (absX > absY) {
      void updateStatus(drag.x > 0 ? swipeToStatus.right : swipeToStatus.left);
    } else {
      void updateStatus(drag.y < 0 ? swipeToStatus.up : swipeToStatus.down);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (postRatingResult || ratingOpen || actionLockRef.current) {
      return;
    }

    const keyMap: Partial<Record<string, GameStatus>> = {
      ArrowRight: "played",
      ArrowLeft: "skipped",
      ArrowUp: "want_to_play",
      ArrowDown: "playing",
    };
    const status = keyMap[event.key];
    if (status) {
      event.preventDefault();
      void updateStatus(status);
    }
  }

  if (!displayedGame) {
    return (
      <section className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-5 rounded-lg border bg-panel p-8 text-center">
        {loadingMore ? (
          <Loader2 className="h-10 w-10 animate-spin text-cyan-200" />
        ) : (
          <SparkleEmpty />
        )}
        <h1 className="text-3xl font-bold">
          {loadingMore
            ? "Finding more games for you..."
            : "Playnira could not load another set yet."}
        </h1>
        <p className="text-zinc-400">
          {loadingMore
            ? "We are checking deeper in the catalog so discovery can keep going."
            : "Try again in a moment, or search for a title while the provider catches up."}
        </p>
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => void loadMoreDiscoveryGames(true)}
            disabled={loadingMore}
          >
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Load more games
          </Button>
          <Button asChild>
            <Link href="/search">Open search</Link>
          </Button>
        </div>
      </section>
    );
  }

  const transform = `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 28}deg)`;
  const activeSwipeDirection = getActiveSwipeDirection(drag);

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-cyan-200">Discovery</p>
          <h1 className="text-3xl font-bold">Have you played this game?</h1>
        </div>
        <p className="text-sm text-zinc-400">
          {postRatingResult
            ? "Recommendation ready"
            : `${Math.min(currentIndex + 1, unansweredGames.length)} of ${
                unansweredGames.length
              }${loadingMore ? " · loading more" : ""}`}
        </p>
      </div>

      {message ? (
        <p
          role="status"
          className="mb-4 rounded-md border border-lime-400/40 bg-lime-400/10 px-3 py-2 text-sm text-lime-100"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-100"
        >
          {error}
        </p>
      ) : null}
      {pendingAnswer ? (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-md border border-cyan-300/40 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving {STATUS_PROMPTS[pendingAnswer.status].toLowerCase()} for{" "}
          {pendingAnswer.gameTitle}. One moment.
        </p>
      ) : null}
      {loadingMore && displayedGame ? (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-md border border-cyan-300/40 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading more discovery cards in the background.
        </p>
      ) : null}

      <SwipeHints activeDirection={activeSwipeDirection} />

      <article
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-busy={pendingAnswer ? true : undefined}
        aria-label={`${displayedGame.title}. Swipe right for played, up for backlog, left to skip, or down for currently playing. Buttons are below.`}
        data-testid="discovery-card"
        className="relative grid gap-5 rounded-lg border bg-panel-strong p-4 shadow-xl transition-transform focus-visible:outline-2 lg:grid-cols-[minmax(280px,420px)_1fr]"
        style={{ transform }}
      >
        <div className="space-y-3">
          <div
            data-testid="discovery-swipe-surface"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={cancelDrag}
            className="relative mx-auto w-full max-w-[min(78vw,340px)] touch-none select-none md:max-w-none"
          >
            {activeSwipeDirection ? (
              <SwipePreview direction={activeSwipeDirection} />
            ) : null}
            <GameArtwork
              src={displayedGame.coverImageUrl}
              alt={`${displayedGame.title} cover artwork`}
              priority
              className="aspect-[3/4] max-h-[58vh] w-full md:max-h-none"
            />
            <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-md border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-xs font-semibold text-zinc-300 shadow-lg md:hidden">
              Drag the cover to answer. Scroll below for details and buttons.
            </div>
          </div>
          {displayedGame.screenshots[0] ? (
            <GameArtwork
              src={displayedGame.screenshots[0]}
              alt={`${displayedGame.title} screenshot preview`}
              className="hidden aspect-video w-full md:block"
            />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black tracking-normal">
                  {displayedGame.title}
                </h2>
                <p className="text-zinc-400">
                  {getReleaseYear(displayedGame.releaseDate)}
                  {displayedGame.developer
                    ? ` · ${displayedGame.developer}`
                    : ""}
                  {displayedGame.publisher
                    ? ` · ${displayedGame.publisher}`
                    : ""}
                </p>
              </div>
              {displayedGame.externalRating ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-lime-400/40 bg-lime-400/10 px-3 py-2 font-semibold text-lime-100">
                  <Star className="h-4 w-4 fill-lime-100" />{" "}
                  {displayedGame.externalRating}
                </span>
              ) : null}
            </div>
            <p className="line-clamp-3 max-w-3xl text-base leading-7 text-zinc-300 md:line-clamp-none">
              {displayedGame.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {displayedGame.genres.map((genre) => (
              <Badge key={genre}>{genre}</Badge>
            ))}
          </div>
          <div className="text-sm text-zinc-400">
            <strong className="text-zinc-200">Platforms:</strong>{" "}
            {displayedGame.platforms.join(", ")}
            {displayedGame.estimatedPlaytime
              ? ` · ${displayedGame.estimatedPlaytime}h estimated`
              : ""}
          </div>

          {postRatingResult ? (
            <div className="mt-auto rounded-lg border border-lime-300/30 bg-lime-300/10 p-4">
              <p className="text-sm font-semibold uppercase text-lime-200">
                Rating saved
              </p>
              <p className="mt-2 text-base leading-6 text-zinc-100">
                {postRatingResult.message}
              </p>
            </div>
          ) : (
            <div className="mt-auto grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(Object.keys(STATUS_PROMPTS) as GameStatus[]).map((status) => {
                const Icon = actionIcons[status];
                return (
                  <Button
                    key={status}
                    type="button"
                    variant={
                      status === "not_interested"
                        ? "danger"
                        : status === "played"
                          ? "default"
                          : "secondary"
                    }
                    onClick={() => updateStatus(status)}
                    disabled={busyStatus !== null || favoriteBusy}
                  >
                    {busyStatus === status ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    {STATUS_PROMPTS[status]}
                  </Button>
                );
              })}
              <Button
                type="button"
                variant="outline"
                onClick={toggleFavorite}
                disabled={busyStatus !== null || favoriteBusy}
              >
                {favoriteBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}{" "}
                Favorite
              </Button>
              <Button asChild variant="outline">
                <Link href={`/games/${displayedGame.slug}`}>View details</Link>
              </Button>
            </div>
          )}
        </div>
      </article>

      {postRatingResult ? (
        <PostRatingPanel
          result={postRatingResult}
          onChoose={(game) =>
            chooseRecommendation(game, postRatingResult.recommendations)
          }
          onContinue={() => {
            setPostRatingResult(null);
            setMessage(null);
          }}
        />
      ) : null}

      {ratingGame ? (
        <RatingDialog
          key={ratingGame.slug}
          game={ratingGame}
          open={ratingOpen}
          onOpenChange={(nextOpen) => {
            setRatingOpen(nextOpen);
            if (!nextOpen) {
              setRatingGame(null);
            }
          }}
          onSaved={(entry, savedMessage, recommendations) => {
            rememberEntry(entry);
            queueRecommendations(
              recommendations?.map((recommendation) => recommendation.game) ??
                [],
            );
            setMessage(null);
            setPostRatingResult({
              ratedGame: ratingGame,
              message: savedMessage,
              recommendations: recommendations ?? [],
            });
          }}
        />
      ) : null}
    </section>
  );
}

function PostRatingPanel({
  result,
  onChoose,
  onContinue,
}: {
  result: PostRatingResult;
  onChoose: (game: GameSummary) => void;
  onContinue: () => void;
}) {
  return (
    <div
      role="status"
      className="mt-5 space-y-4 rounded-lg border border-lime-300/30 bg-lime-300/10 p-4"
    >
      <div>
        <p className="text-sm font-semibold uppercase text-lime-200">
          Choose what comes next
        </p>
        <p className="mt-2 text-base leading-6 text-zinc-100">
          Pick a recommendation to bring it to the front of discovery, or keep
          going with the first suggestion.
        </p>
      </div>

      {result.recommendations.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {result.recommendations.map((choice) => (
            <article
              key={choice.game.slug}
              className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950/80"
            >
              <GameArtwork
                src={choice.game.coverImageUrl}
                alt={`${choice.game.title} cover artwork`}
                className="aspect-[2/3] w-full rounded-none"
              />
              <div className="flex flex-1 flex-col gap-3 p-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-base font-bold text-zinc-50">
                    {choice.game.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                    {choice.reason ?? choice.game.description}
                  </p>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onChoose(choice.game)}
                  >
                    Pick
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/games/${choice.game.slug}`}>Details</Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <Button type="button" onClick={onContinue}>
        {result.recommendations.length
          ? "Show recommendation"
          : "Show next game"}{" "}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function getActiveSwipeDirection(drag: {
  active: boolean;
  x: number;
  y: number;
}) {
  if (!drag.active) {
    return null;
  }

  const absX = Math.abs(drag.x);
  const absY = Math.abs(drag.y);
  if (Math.max(absX, absY) < 28) {
    return null;
  }

  if (absX > absY) {
    return drag.x > 0 ? "right" : "left";
  }

  return drag.y < 0 ? "up" : "down";
}

function SwipeHints({
  activeDirection,
}: {
  activeDirection: SwipeDirection | null;
}) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 text-xs font-bold sm:grid-cols-4">
      {swipeHints.map(({ direction, label, Icon, className }) => (
        <div
          key={direction}
          className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 transition ${
            activeDirection === direction
              ? `${className} scale-[1.02]`
              : "border-zinc-700 bg-zinc-950/70 text-zinc-400"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </div>
      ))}
    </div>
  );
}

function SwipePreview({ direction }: { direction: SwipeDirection }) {
  const hint = swipeHints.find((item) => item.direction === direction);
  if (!hint) {
    return null;
  }

  const Icon = hint.Icon;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border px-4 py-2 text-sm font-black shadow-xl backdrop-blur ${hint.className}`}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {STATUS_PROMPTS[swipeToStatus[direction]]}
      </span>
    </div>
  );
}

function SparkleEmpty() {
  return (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-cyan-300 text-zinc-950">
      <Star className="h-6 w-6" />
    </span>
  );
}
