import { unstable_cache } from "next/cache";
import type { GameSearchOptions, PopularGamesOptions } from "@/lib/games/types";
import { fallbackGameProvider, getGameProvider } from "@/lib/games/provider";

const POPULAR_REVALIDATE_SECONDS = 60 * 20;
const SEARCH_REVALIDATE_SECONDS = 60 * 10;
const DETAILS_REVALIDATE_SECONDS = 60 * 60 * 6;

type NormalizedPopularOptions = {
  page: number;
  pageSize: number;
  genres: string[];
  platforms: string[];
};

type NormalizedSearchOptions = NormalizedPopularOptions & {
  releaseYear?: number;
  ordering: NonNullable<GameSearchOptions["ordering"]>;
};

function normalizeList(values?: string[]) {
  return [...(values ?? [])].sort((a, b) => a.localeCompare(b));
}

function normalizePopularOptions(
  options?: PopularGamesOptions,
): NormalizedPopularOptions {
  return {
    page: options?.page ?? 1,
    pageSize: options?.pageSize ?? 30,
    genres: normalizeList(options?.genres),
    platforms: normalizeList(options?.platforms),
  };
}

function normalizeSearchOptions(
  options?: GameSearchOptions,
): NormalizedSearchOptions {
  return {
    ...normalizePopularOptions(options),
    releaseYear: options?.releaseYear,
    ordering: options?.ordering ?? "relevance",
  };
}

const readCachedPopularGames = unstable_cache(
  async (options: NormalizedPopularOptions) =>
    getGameProvider().getPopularGames(options),
  ["playnext-game-provider-popular-v1"],
  {
    revalidate: POPULAR_REVALIDATE_SECONDS,
    tags: ["game-provider", "popular-games"],
  },
);

const readCachedSearchGames = unstable_cache(
  async (query: string, options: NormalizedSearchOptions) =>
    getGameProvider().searchGames(query, options),
  ["playnext-game-provider-search-v1"],
  {
    revalidate: SEARCH_REVALIDATE_SECONDS,
    tags: ["game-provider", "game-search"],
  },
);

const readCachedGameBySlug = unstable_cache(
  async (slug: string) =>
    (await getGameProvider().getGameBySlug(slug)) ??
    fallbackGameProvider.getGameBySlug(slug),
  ["playnext-game-provider-details-v1"],
  {
    revalidate: DETAILS_REVALIDATE_SECONDS,
    tags: ["game-provider", "game-details"],
  },
);

const readCachedSimilarGames = unstable_cache(
  async (gameId: string) => getGameProvider().getSimilarGames(gameId),
  ["playnext-game-provider-similar-v1"],
  {
    revalidate: DETAILS_REVALIDATE_SECONDS,
    tags: ["game-provider", "similar-games"],
  },
);

export function getCachedPopularGames(options?: PopularGamesOptions) {
  return readCachedPopularGames(normalizePopularOptions(options));
}

export function searchCachedGames(query: string, options?: GameSearchOptions) {
  return readCachedSearchGames(query, normalizeSearchOptions(options));
}

export function getCachedGameBySlug(slug: string) {
  return readCachedGameBySlug(slug);
}

export function getCachedSimilarGames(gameId: string) {
  return readCachedSimilarGames(gameId);
}
