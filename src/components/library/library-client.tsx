"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LibraryBig } from "lucide-react";
import { GameCard } from "@/components/games/game-card";
import { RatingDialog } from "@/components/games/rating-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { GameSummary } from "@/lib/games/types";
import { filterLibraryEntries } from "@/lib/library/filter";
import type { LibraryEntry, LibraryFilter } from "@/lib/types";

const tabs: Array<{ href: string; label: string; filter: LibraryFilter }> = [
  { href: "/library", label: "All games", filter: "all" },
  { href: "/library/played", label: "Played", filter: "played" },
  { href: "/library/playing", label: "Currently playing", filter: "playing" },
  {
    href: "/library/want-to-play",
    label: "Want to play",
    filter: "want_to_play",
  },
  { href: "/library/dropped", label: "Dropped", filter: "dropped" },
  { href: "/library/hidden", label: "Hidden", filter: "hidden" },
  { href: "/library/favorites", label: "Favorites", filter: "favorites" },
  {
    href: "/library/unrated",
    label: "Played but not rated",
    filter: "unrated",
  },
];

export function LibraryClient({
  entries,
  activeFilter,
}: {
  entries: LibraryEntry[];
  activeFilter: LibraryFilter;
}) {
  const [localEntries, setLocalEntries] = useState(entries);
  const [ratingGame, setRatingGame] = useState<GameSummary | null>(null);
  const filtered = useMemo(
    () => filterLibraryEntries(localEntries, activeFilter),
    [localEntries, activeFilter],
  );

  function updateEntry(entry: LibraryEntry) {
    setLocalEntries((current) => {
      const without = current.filter(
        (candidate) => candidate.game.slug !== entry.game.slug,
      );
      return [entry, ...without];
    });
  }

  function removeEntry(gameSlug: string) {
    setLocalEntries((current) =>
      current.filter((entry) => entry.game.slug !== gameSlug),
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-cyan-200">Library</p>
          <h1 className="text-3xl font-bold">
            {tabs.find((tab) => tab.filter === activeFilter)?.label}
          </h1>
          <p className="mt-2 text-zinc-400">
            Change statuses, rate played games, and keep the backlog honest.
          </p>
        </div>
        <Button asChild>
          <Link href="/discover">Discover more</Link>
        </Button>
      </div>

      <nav
        className="flex gap-2 overflow-x-auto pb-1"
        aria-label="Library filters"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline-2 ${
              tab.filter === activeFilter
                ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                : "bg-panel text-zinc-300 hover:border-cyan-300"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <EmptyState
          icon={LibraryBig}
          title="No games here yet."
          description="Answer a few discovery cards or search for a favorite title. PlayNext will keep the list updated from your choices."
          actionHref="/discover"
          actionLabel="Open discovery"
          secondaryHref="/search"
          secondaryLabel="Search games"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((entry, index) => (
            <GameCard
              key={entry.game.slug}
              game={entry.game}
              entry={entry}
              priority={index < 4}
              onChanged={updateEntry}
              onRemoved={removeEntry}
              onPlayed={() => setRatingGame(entry.game)}
              onFavoriteSelected={() => setRatingGame(entry.game)}
              removable
            />
          ))}
        </div>
      )}

      {ratingGame ? (
        <RatingDialog
          game={ratingGame}
          open={Boolean(ratingGame)}
          onOpenChange={(open) => {
            if (!open) {
              setRatingGame(null);
            }
          }}
          onSaved={(entry) => updateEntry(entry)}
        />
      ) : null}
    </section>
  );
}
