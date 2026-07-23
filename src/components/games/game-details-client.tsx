"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock3, Gamepad2, Star } from "lucide-react";
import { BarList } from "@/components/charts/bar-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameArtwork } from "@/components/games/game-artwork";
import { RatingDialog } from "@/components/games/rating-dialog";
import { StatusButtons } from "@/components/games/status-buttons";
import type { GameDetails, GameSummary } from "@/lib/games/types";
import type { GameRatingBreakdown, LibraryEntry } from "@/lib/types";
import { formatCompactDate } from "@/lib/utils";

export function GameDetailsClient({
  game,
  initialEntry,
  similarGames,
  ratingBreakdown,
}: {
  game: GameDetails;
  initialEntry?: LibraryEntry | null;
  similarGames: GameSummary[];
  ratingBreakdown: GameRatingBreakdown;
}) {
  const [entry, setEntry] = useState<LibraryEntry | null>(initialEntry ?? null);
  const [ratingOpen, setRatingOpen] = useState(false);

  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-lg border bg-zinc-950">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('${game.backgroundImageUrl ?? game.coverImageUrl ?? ""}')`,
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.96),rgba(9,9,11,0.88),rgba(9,9,11,0.76))]" />

        <div className="relative grid gap-6 p-4 sm:p-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:p-8">
          <div className="mx-auto w-full max-w-64 lg:max-w-none">
            <GameArtwork
              src={game.coverImageUrl}
              alt={`${game.title} cover artwork`}
              priority
              className="aspect-[2/3] w-full shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-950/70 px-2.5 py-1">
                  <Calendar className="h-4 w-4" />{" "}
                  {formatCompactDate(game.releaseDate)}
                </span>
                {game.estimatedPlaytime ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-950/70 px-2.5 py-1">
                    <Clock3 className="h-4 w-4" /> {game.estimatedPlaytime}h
                  </span>
                ) : null}
                {game.externalRating ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-lime-300/30 bg-lime-300/10 px-2.5 py-1 font-semibold text-lime-100">
                    <Star className="h-4 w-4 fill-lime-100" />{" "}
                    {game.externalRating}
                  </span>
                ) : null}
              </div>
              <h1 className="text-3xl font-black tracking-normal text-zinc-50 sm:text-4xl lg:text-5xl">
                {game.title}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-zinc-200">
                {game.description}
              </p>
            </header>

            <div className="grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
              <MetaItem label="Developer" value={game.developer} />
              <MetaItem label="Publisher" value={game.publisher} />
              <MetaItem
                label="Your status"
                value={
                  entry?.userGame.status.replaceAll("_", " ") ??
                  "Not in library"
                }
              />
              <MetaItem
                label="Your rating"
                value={
                  entry?.rating
                    ? `${entry.rating.overallRating}/10`
                    : "Not rated"
                }
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {game.genres.slice(0, 5).map((genre) => (
                <Badge key={genre}>{genre}</Badge>
              ))}
              {game.platforms.slice(0, 6).map((platform) => (
                <Badge key={platform} className="bg-zinc-950/70">
                  {platform}
                </Badge>
              ))}
            </div>

            <div className="rounded-lg border bg-zinc-950/78 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.24)]">
              <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase text-zinc-400">
                    Your library
                  </p>
                  <p className="text-sm text-zinc-300">
                    Update this game without leaving the page.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRatingOpen(true)}
                  className="h-auto min-h-11 whitespace-normal"
                >
                  <Gamepad2 className="h-4 w-4" />
                  {entry?.rating ? "Edit rating" : "Rate this game"}
                </Button>
              </div>
              <StatusButtons
                gameSlug={game.slug}
                currentStatus={entry?.userGame.status}
                favorite={entry?.userGame.isFavorite}
                onChanged={setEntry}
                onRemoved={() => setEntry(null)}
                onPlayed={() => setRatingOpen(true)}
                onFavoriteSelected={(updatedEntry) => {
                  if (!updatedEntry.rating) {
                    setRatingOpen(true);
                  }
                }}
                removable={Boolean(entry)}
              />
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoPanel label="Status" value={entry?.userGame.status ?? "None"} />
        <InfoPanel
          label="Rating"
          value={entry?.rating ? `${entry.rating.overallRating}/10` : "None"}
        />
        <InfoPanel
          label="Favorite"
          value={entry?.userGame.isFavorite ? "Yes" : "No"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-lg border bg-panel p-5">
          <p className="text-xs font-semibold uppercase text-zinc-500">
            Player rating
          </p>
          <p className="mt-2 text-4xl font-black text-zinc-50">
            {ratingBreakdown.averageRating
              ? `${ratingBreakdown.averageRating}/10`
              : "N/A"}
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            {ratingBreakdown.totalRatings
              ? `${ratingBreakdown.totalRatings} player rating${
                  ratingBreakdown.totalRatings === 1 ? "" : "s"
                }`
              : "No player ratings yet."}
          </p>
        </div>
        <div className="rounded-lg border bg-panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Rating breakdown</h2>
            <span className="text-xs font-semibold uppercase text-zinc-500">
              Players
            </span>
          </div>
          <BarList
            items={ratingBreakdown.distribution}
            label={`${game.title} player rating breakdown`}
            maxValue={Math.max(
              1,
              ...ratingBreakdown.distribution.map((item) => item.value),
            )}
          />
        </div>
      </section>

      {entry?.rating?.review ? (
        <section className="rounded-lg border bg-panel p-5">
          <h2 className="mb-2 text-2xl font-bold">Your review</h2>
          <p className="leading-7 text-zinc-300">{entry.rating.review}</p>
        </section>
      ) : null}

      {game.screenshots.length ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Screenshots</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {game.screenshots.slice(0, 4).map((screenshot) => (
              <GameArtwork
                key={screenshot}
                src={screenshot}
                alt={`${game.title} screenshot`}
                className="aspect-video w-full"
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Similar games</h2>
        {similarGames.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarGames.map((similar) => (
              <Link
                key={similar.slug}
                href={`/games/${similar.slug}`}
                className="rounded-lg border bg-panel p-3 hover:border-cyan-300 focus-visible:outline-2"
              >
                <GameArtwork
                  src={similar.coverImageUrl}
                  alt={`${similar.title} cover`}
                  className="aspect-[3/4] w-full"
                />
                <p className="mt-3 font-semibold">{similar.title}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border bg-panel p-5 text-zinc-400">
            No similar games found yet.
          </p>
        )}
      </section>

      <RatingDialog
        game={game}
        open={ratingOpen}
        onOpenChange={setRatingOpen}
        onSaved={(savedEntry) => setEntry(savedEntry)}
      />
    </section>
  );
}

function MetaItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <p className="min-w-0 rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 capitalize">
      <strong className="text-zinc-100">{label}:</strong>{" "}
      <span className="text-zinc-300">{value || "Unknown"}</span>
    </p>
  );
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-panel p-4">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 capitalize text-zinc-100">
        {value.replaceAll("_", " ")}
      </p>
    </div>
  );
}
