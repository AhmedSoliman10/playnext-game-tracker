import Link from "next/link";
import { Flame, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GameArtwork } from "@/components/games/game-artwork";
import type { GameSummary } from "@/lib/games/types";
import { getReleaseYear } from "@/lib/utils";

export function PopularNowCarousel({
  games,
  title = "Popular right now",
  description = "High-signal games from the live catalog and seeded fallback.",
}: {
  games: GameSummary[];
  title?: string;
  description?: string;
}) {
  if (!games.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-lime-200">
            <Flame className="h-4 w-4" />
            Popular right now
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-normal text-zinc-50">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            {description}
          </p>
        </div>
        <Link
          href="/search?sort=external-rating"
          className="text-sm font-semibold text-cyan-200 hover:text-cyan-100 focus-visible:outline-2"
        >
          Browse more
        </Link>
      </div>

      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {games.slice(0, 12).map((game, index) => (
          <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            className="group relative flex min-h-80 w-72 shrink-0 snap-start overflow-hidden rounded-lg border bg-zinc-950 focus-visible:outline-2 sm:w-80"
          >
            <GameArtwork
              src={game.backgroundImageUrl ?? game.coverImageUrl}
              alt={`${game.title} artwork`}
              priority={index < 2}
              className="absolute inset-0 h-full w-full rounded-none opacity-70 transition duration-300 group-hover:scale-105 group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.08),rgba(9,9,11,0.72)_54%,rgba(9,9,11,0.98))]" />
            <div className="relative mt-auto w-full space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <Badge className="border-zinc-700 bg-zinc-950/80 text-zinc-200">
                  {getReleaseYear(game.releaseDate)}
                </Badge>
                {game.externalRating ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-zinc-950/88 px-2 py-1 text-xs font-black text-lime-200">
                    <Star className="h-3.5 w-3.5 fill-lime-200" />
                    {game.externalRating}
                  </span>
                ) : null}
              </div>
              <div>
                <h3 className="line-clamp-2 text-xl font-black leading-tight text-zinc-50">
                  {game.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-zinc-300">
                  {game.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {game.genres.slice(0, 2).map((genre) => (
                  <span
                    key={genre}
                    className="rounded-sm border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-[11px] font-semibold text-cyan-100"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
