"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { GameCard } from "@/components/games/game-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GameSummary } from "@/lib/games/types";
import type { GameSearchParams } from "@/lib/validation/search";
import type { GameStatus, LibraryEntry } from "@/lib/types";

export function SearchClient({
  genres,
  platforms,
  initialParams,
  initialEntries,
}: {
  genres: string[];
  platforms: string[];
  initialParams: GameSearchParams;
  initialEntries: LibraryEntry[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialParams.q);
  const [genre, setGenre] = useState(initialParams.genre);
  const [platform, setPlatform] = useState(initialParams.platform);
  const [year, setYear] = useState(
    initialParams.year ? String(initialParams.year) : "",
  );
  const [status, setStatus] = useState<GameStatus | "">(
    initialParams.status ?? "",
  );
  const [minRating, setMinRating] = useState(
    initialParams.minRating ? String(initialParams.minRating) : "",
  );
  const [sort, setSort] = useState(initialParams.sort);
  const [page, setPage] = useState(initialParams.page);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [queryUsed, setQueryUsed] = useState<string | null>(null);
  const [attribution, setAttribution] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [entriesBySlug, setEntriesBySlug] = useState(
    () => new Map(initialEntries.map((entry) => [entry.game.slug, entry])),
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (genre) params.set("genre", genre);
      if (platform) params.set("platform", platform);
      if (year) params.set("year", year);
      if (status) params.set("status", status);
      if (minRating) params.set("minRating", minRating);
      if (sort && sort !== "relevance") params.set("sort", sort);
      if (page > 1) params.set("page", String(page));

      const nextUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });

      setIsLoading(true);
      setError(null);
      fetch(`/api/games/search?${params.toString()}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          const payload = (await response.json()) as {
            games?: GameSummary[];
            total?: number;
            hasNextPage?: boolean;
            queryUsed?: string;
            attribution?: string;
            error?: string;
          };
          if (!response.ok || !payload.games) {
            throw new Error(payload.error ?? "Could not search games.");
          }
          setGames(payload.games);
          setTotal(payload.total ?? payload.games.length);
          setHasNextPage(Boolean(payload.hasNextPage));
          setQueryUsed(payload.queryUsed ?? null);
          setAttribution(payload.attribution ?? null);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setError(
            error instanceof Error ? error.message : "Could not search games.",
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [
    genre,
    minRating,
    page,
    pathname,
    platform,
    query,
    router,
    sort,
    status,
    year,
  ]);

  const filteredGames = useMemo(() => {
    const min = minRating ? Number(minRating) : null;
    const filtered = games.filter((game) => {
      const entry = entriesBySlug.get(game.slug);
      const statusMatch = !status || entry?.userGame.status === status;
      const ratingMatch = !min || (entry?.rating?.overallRating ?? 0) >= min;
      return statusMatch && ratingMatch;
    });

    if (sort === "user-rating") {
      return filtered.sort(
        (a, b) =>
          (entriesBySlug.get(b.slug)?.rating?.overallRating ?? 0) -
          (entriesBySlug.get(a.slug)?.rating?.overallRating ?? 0),
      );
    }

    return filtered;
  }, [entriesBySlug, games, minRating, sort, status]);

  const hasActiveFilters = Boolean(
    query ||
    genre ||
    platform ||
    year ||
    status ||
    minRating ||
    sort !== "relevance",
  );

  function clearFilters() {
    setQuery("");
    setGenre("");
    setPlatform("");
    setYear("");
    setStatus("");
    setMinRating("");
    setSort("relevance");
    setPage(1);
  }

  function resetPageAnd(update: () => void) {
    update();
    setPage(1);
  }

  const pageStart = filteredGames.length > 0 ? (page - 1) * 25 + 1 : 0;
  const pageEnd = (page - 1) * 25 + filteredGames.length;
  const resultLabel =
    isPending || isLoading
      ? "Updating filters..."
      : filteredGames.length
        ? `Showing ${pageStart}-${pageEnd}${hasNextPage ? "+" : ""}`
        : "0 results shown";

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-cyan-200">Search</p>
          <h1 className="text-3xl font-bold">Find games</h1>
          <p className="mt-2 text-zinc-400">
            Search IGDB by title or browse by category, platform, and year.
          </p>
        </div>
        {hasActiveFilters ? (
          <Button type="button" variant="secondary" onClick={clearFilters}>
            <X className="h-4 w-4" /> Clear filters
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 rounded-lg border bg-panel p-4 lg:grid-cols-4">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="q">Search by title</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-zinc-500" />
            <Input
              id="q"
              value={query}
              onChange={(event) =>
                resetPageAnd(() => setQuery(event.target.value))
              }
              className="pl-10"
              placeholder="Try Diner Dash, God of War, racing..."
            />
          </div>
        </div>
        <SelectField
          label="Genre"
          value={genre}
          onChange={(value) => resetPageAnd(() => setGenre(value))}
          options={genres}
        />
        <SelectField
          label="Platform"
          value={platform}
          onChange={(value) => resetPageAnd(() => setPlatform(value))}
          options={platforms}
        />
        <div className="space-y-2">
          <Label htmlFor="year">Release year</Label>
          <Input
            id="year"
            inputMode="numeric"
            value={year}
            onChange={(event) =>
              resetPageAnd(() => setYear(event.target.value))
            }
            placeholder="2023"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(event) =>
              resetPageAnd(() =>
                setStatus(event.target.value as GameStatus | ""),
              )
            }
            className="h-11 w-full rounded-md border bg-zinc-950 px-3 text-sm"
          >
            <option value="">Any status</option>
            <option value="played">Played</option>
            <option value="playing">Currently playing</option>
            <option value="want_to_play">Want to play</option>
            <option value="dropped">Dropped</option>
            <option value="not_interested">Not interested</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="minRating">Minimum user rating</Label>
          <select
            id="minRating"
            value={minRating}
            onChange={(event) =>
              resetPageAnd(() => setMinRating(event.target.value))
            }
            className="h-11 w-full rounded-md border bg-zinc-950 px-3 text-sm"
          >
            <option value="">Any rating</option>
            {[6, 7, 8, 9].map((rating) => (
              <option key={rating} value={rating}>
                {rating}+
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort">Sort by</Label>
          <select
            id="sort"
            value={sort}
            onChange={(event) =>
              resetPageAnd(() =>
                setSort(event.target.value as GameSearchParams["sort"]),
              )
            }
            className="h-11 w-full rounded-md border bg-zinc-950 px-3 text-sm"
          >
            <option value="relevance">Relevance</option>
            <option value="release-date">Release date</option>
            <option value="external-rating">External rating</option>
            <option value="user-rating">User rating</option>
          </select>
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap gap-2 text-sm">
          <FilterChip
            label="Title"
            value={query}
            onClear={() => resetPageAnd(() => setQuery(""))}
          />
          <FilterChip
            label="Genre"
            value={genre}
            onClear={() => resetPageAnd(() => setGenre(""))}
          />
          <FilterChip
            label="Platform"
            value={platform}
            onClear={() => resetPageAnd(() => setPlatform(""))}
          />
          <FilterChip
            label="Year"
            value={year}
            onClear={() => resetPageAnd(() => setYear(""))}
          />
          <FilterChip
            label="Status"
            value={status ? status.replaceAll("_", " ") : ""}
            onClear={() => resetPageAnd(() => setStatus(""))}
          />
          <FilterChip
            label="Rating"
            value={minRating ? `${minRating}+` : ""}
            onClear={() => resetPageAnd(() => setMinRating(""))}
          />
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-2 text-sm text-zinc-400 sm:flex-row">
        <span>{resultLabel}</span>
        {attribution ? <span>{attribution}</span> : null}
      </div>

      {queryUsed ? (
        <p className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
          Showing results for <strong>{queryUsed}</strong>.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-100"
        >
          {error}
        </p>
      ) : null}

      {isLoading && filteredGames.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 25 }, (_, index) => (
            <div
              key={index}
              className="aspect-[2/3] animate-pulse rounded-md border bg-zinc-900"
            />
          ))}
        </div>
      ) : filteredGames.length ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredGames.map((game) => (
              <GameCard
                key={game.slug}
                game={game}
                entry={entriesBySlug.get(game.slug)}
                onChanged={(entry) => {
                  setEntriesBySlug((current) => {
                    const next = new Map(current);
                    next.set(entry.game.slug, entry);
                    return next;
                  });
                }}
                onRemoved={(gameSlug) => {
                  setEntriesBySlug((current) => {
                    const next = new Map(current);
                    next.delete(gameSlug);
                    return next;
                  });
                }}
                removable={entriesBySlug.has(game.slug)}
              />
            ))}
          </div>
          <PaginationControls
            page={page}
            hasNextPage={hasNextPage}
            isLoading={isLoading}
            total={total}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => current + 1)}
          />
        </>
      ) : (
        <div className="rounded-lg border bg-panel p-8 text-center">
          <h2 className="text-xl font-bold">No results found.</h2>
          <p className="mt-2 text-zinc-400">
            Try clearing the year first, choosing a broader category, or
            searching a title inside that category.
          </p>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="secondary"
              onClick={clearFilters}
              className="mt-5"
            >
              <X className="h-4 w-4" /> Clear filters
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}

function PaginationControls({
  page,
  hasNextPage,
  isLoading,
  total,
  onPrevious,
  onNext,
}: {
  page: number;
  hasNextPage: boolean;
  isLoading: boolean;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <nav
      className="flex flex-col items-center justify-between gap-3 rounded-lg border bg-panel p-3 text-sm text-zinc-400 sm:flex-row"
      aria-label="Search results pages"
    >
      <span>
        Page {page}
        {hasNextPage
          ? " · more results available"
          : total > 0
            ? " · last page"
            : ""}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onPrevious}
          disabled={page <= 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={!hasNextPage || isLoading}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}

function FilterChip({
  label,
  value,
  onClear,
}: {
  label: string;
  value: string;
  onClear: () => void;
}) {
  if (!value) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 capitalize text-zinc-200 hover:border-lime-300 focus-visible:outline-2"
    >
      <span className="text-zinc-500">{label}:</span> {value}
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const id = label.toLowerCase();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-md border bg-zinc-950 px-3 text-sm"
      >
        <option value="">Any {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
