"use client";

import Link from "next/link";
import { Clock3, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameArtwork } from "@/components/games/game-artwork";
import { StatusButtons } from "@/components/games/status-buttons";
import type { GameSummary } from "@/lib/games/types";
import type { LibraryEntry } from "@/lib/types";
import { getReleaseYear } from "@/lib/utils";

export function GameCard({
  game,
  entry,
  onChanged,
  onRemoved,
  onPlayed,
  priority = false,
  removable = false,
}: {
  game: GameSummary;
  entry?: LibraryEntry | null;
  onChanged?: (entry: LibraryEntry) => void;
  onRemoved?: (gameSlug: string) => void;
  onPlayed?: () => void;
  priority?: boolean;
  removable?: boolean;
}) {
  return (
    <article className="group overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 transition hover:-translate-y-1 hover:border-cyan-300/70 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
      <div className="relative">
        <Link
          href={`/games/${game.slug}`}
          className="block focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label={`View details for ${game.title}`}
        >
          <GameArtwork
            src={game.coverImageUrl}
            alt={`${game.title} cover artwork`}
            priority={priority}
            className="aspect-[2/3] w-full rounded-none"
          />
        </Link>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent" />
        {game.externalRating ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-zinc-950/90 px-2 py-1 text-xs font-bold text-lime-200 ring-1 ring-lime-300/30">
            <Star className="h-3.5 w-3.5 fill-lime-200" />
            {game.externalRating}
          </span>
        ) : null}
      </div>
      <div className="flex min-h-64 flex-col gap-3 p-3">
        <div className="space-y-1">
          <h2 className="line-clamp-2 text-base font-bold leading-tight">
            <Link href={`/games/${game.slug}`} className="hover:text-cyan-200">
              {game.title}
            </Link>
          </h2>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {getReleaseYear(game.releaseDate)}
            {entry?.rating ? ` · ${entry.rating.overallRating}/10` : ""}
          </p>
        </div>

        <p className="line-clamp-3 text-sm leading-5 text-zinc-400">
          {game.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {game.genres.slice(0, 2).map((genre) => (
            <Badge key={genre} className="px-1.5 py-0.5 text-[11px]">
              {genre}
            </Badge>
          ))}
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex min-h-5 flex-wrap gap-2 text-xs text-zinc-500">
            {game.platforms[0] ? <span>{game.platforms[0]}</span> : null}
            {game.estimatedPlaytime ? (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" /> {game.estimatedPlaytime}h
              </span>
            ) : null}
          </div>
          <Button asChild variant="secondary" size="sm" className="w-full">
            <Link href={`/games/${game.slug}`}>View details</Link>
          </Button>
          <StatusButtons
            gameSlug={game.slug}
            currentStatus={entry?.userGame.status}
            favorite={entry?.userGame.isFavorite}
            compact
            removable={removable}
            onChanged={onChanged}
            onRemoved={onRemoved}
            onPlayed={onPlayed}
          />
        </div>
      </div>
    </article>
  );
}
