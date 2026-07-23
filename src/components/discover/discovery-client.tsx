"use client";

import Link from "next/link";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  EyeOff,
  Heart,
  PauseCircle,
  Plus,
  RotateCcw,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameArtwork } from "@/components/games/game-artwork";
import { RatingDialog } from "@/components/games/rating-dialog";
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
  left: "not_interested",
  up: "want_to_play",
  down: "skipped",
} as const satisfies Record<string, GameStatus>;

interface PostRatingResult {
  ratedGame: GameSummary;
  message: string;
  recommendation?: GameSummary;
}

export function DiscoveryClient({
  games,
  initialEntries,
  initialAnsweredSlugs,
}: {
  games: GameSummary[];
  initialEntries: LibraryEntry[];
  initialAnsweredSlugs: string[];
}) {
  const [candidateGames, setCandidateGames] = useState(games);
  const [answeredSlugs, setAnsweredSlugs] = useState(
    () =>
      new Set([
        ...initialAnsweredSlugs,
        ...initialEntries.map((entry) => entry.game.slug),
      ]),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingGame, setRatingGame] = useState<GameSummary | null>(null);
  const [postRatingResult, setPostRatingResult] =
    useState<PostRatingResult | null>(null);
  const [busyStatus, setBusyStatus] = useState<GameStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState({ active: false, x: 0, y: 0 });
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const unansweredGames = useMemo(
    () => candidateGames.filter((game) => !answeredSlugs.has(game.slug)),
    [answeredSlugs, candidateGames],
  );
  const currentGame = unansweredGames[currentIndex] ?? null;
  const displayedGame =
    postRatingResult?.ratedGame ?? ratingGame ?? currentGame;

  function advance() {
    setCurrentIndex((index) =>
      Math.min(index, Math.max(0, unansweredGames.length - 2)),
    );
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

  function queueRecommendation(game: GameSummary) {
    setCandidateGames((current) => {
      const withoutRecommendation = current.filter(
        (candidate) => candidate.slug !== game.slug,
      );
      const insertionIndex = Math.min(
        currentIndex,
        withoutRecommendation.length,
      );

      return [
        ...withoutRecommendation.slice(0, insertionIndex),
        game,
        ...withoutRecommendation.slice(insertionIndex),
      ];
    });
  }

  async function updateStatus(status: GameStatus) {
    if (!currentGame || postRatingResult) {
      return;
    }

    setBusyStatus(status);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/user-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug: currentGame.slug, status }),
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
        setRatingGame(currentGame);
        setRatingOpen(true);
      } else {
        setMessage(
          `${currentGame.title} moved to ${STATUS_PROMPTS[status].toLowerCase()}.`,
        );
        advance();
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save your answer.",
      );
    } finally {
      setBusyStatus(null);
    }
  }

  async function toggleFavorite() {
    if (!currentGame || postRatingResult) {
      return;
    }

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
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (postRatingResult || ratingOpen) {
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
    if (!startRef.current || !drag.active) {
      return;
    }
    setDrag({
      active: true,
      x: event.clientX - startRef.current.x,
      y: event.clientY - startRef.current.y,
    });
  }

  function onPointerUp() {
    if (postRatingResult || ratingOpen) {
      return;
    }

    if (!drag.active) {
      return;
    }

    const absX = Math.abs(drag.x);
    const absY = Math.abs(drag.y);
    const threshold = 90;
    setDrag({ active: false, x: 0, y: 0 });

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
    if (postRatingResult || ratingOpen) {
      return;
    }

    const keyMap: Partial<Record<string, GameStatus>> = {
      ArrowRight: "played",
      ArrowLeft: "not_interested",
      ArrowUp: "want_to_play",
      ArrowDown: "skipped",
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
        <SparkleEmpty />
        <h1 className="text-3xl font-bold">
          You answered every game in this batch.
        </h1>
        <p className="text-zinc-400">
          Search for a specific title or check the dashboard for recommendations
          based on your library.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/search">Open search</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </section>
    );
  }

  const transform = `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 28}deg)`;

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
              }`}
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

      <article
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag({ active: false, x: 0, y: 0 })}
        aria-label={`${displayedGame.title}. Swipe or use arrow keys to answer. Buttons are below.`}
        data-testid="discovery-card"
        className="grid touch-pan-y gap-5 rounded-lg border bg-panel-strong p-4 shadow-xl transition-transform focus-visible:outline-2 lg:grid-cols-[minmax(280px,420px)_1fr]"
        style={{ transform }}
      >
        <div className="space-y-3">
          <GameArtwork
            src={displayedGame.coverImageUrl}
            alt={`${displayedGame.title} cover artwork`}
            priority
            className="aspect-[3/4] w-full"
          />
          {displayedGame.screenshots[0] ? (
            <GameArtwork
              src={displayedGame.screenshots[0]}
              alt={`${displayedGame.title} screenshot preview`}
              className="aspect-video w-full"
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
            <p className="max-w-3xl text-base leading-7 text-zinc-300">
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
            <PostRatingPanel
              result={postRatingResult}
              onContinue={() => {
                setPostRatingResult(null);
                setMessage(null);
              }}
            />
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
                    disabled={busyStatus !== null}
                  >
                    <Icon className="h-4 w-4" />
                    {STATUS_PROMPTS[status]}
                  </Button>
                );
              })}
              <Button type="button" variant="outline" onClick={toggleFavorite}>
                <Heart className="h-4 w-4" /> Favorite
              </Button>
              <Button asChild variant="outline">
                <Link href={`/games/${displayedGame.slug}`}>View details</Link>
              </Button>
            </div>
          )}
        </div>
      </article>

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
          onSaved={(entry, savedMessage, recommendation) => {
            rememberEntry(entry);
            if (recommendation) {
              queueRecommendation(recommendation);
            }
            setMessage(null);
            setPostRatingResult({
              ratedGame: ratingGame,
              message: savedMessage,
              recommendation,
            });
          }}
        />
      ) : null}
    </section>
  );
}

function PostRatingPanel({
  result,
  onContinue,
}: {
  result: PostRatingResult;
  onContinue: () => void;
}) {
  return (
    <div
      role="status"
      className="mt-auto space-y-4 rounded-lg border border-lime-300/30 bg-lime-300/10 p-4"
    >
      <div>
        <p className="text-sm font-semibold uppercase text-lime-200">
          PlayNext recommendation
        </p>
        <p className="mt-2 text-base leading-6 text-zinc-100">
          {result.message}
        </p>
      </div>

      {result.recommendation ? (
        <Link
          href={`/games/${result.recommendation.slug}`}
          className="grid gap-3 rounded-md border border-zinc-700 bg-zinc-950/80 p-3 transition hover:border-lime-300 focus-visible:outline-2 sm:grid-cols-[88px_1fr]"
        >
          <GameArtwork
            src={result.recommendation.coverImageUrl}
            alt={`${result.recommendation.title} cover artwork`}
            className="aspect-[2/3] w-24 sm:w-full"
          />
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-lg font-bold text-zinc-50">
              {result.recommendation.title}
            </span>
            <span className="line-clamp-2 text-sm text-zinc-400">
              {result.recommendation.description}
            </span>
            <span className="mt-1 text-sm font-semibold text-lime-200">
              View recommendation
            </span>
          </span>
        </Link>
      ) : null}

      <Button type="button" onClick={onContinue}>
        {result.recommendation ? "Show recommendation" : "Show next game"}{" "}
        <ArrowRight className="h-4 w-4" />
      </Button>
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
