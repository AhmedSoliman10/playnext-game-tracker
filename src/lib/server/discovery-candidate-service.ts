import type { GameSummary } from "@/lib/games/types";
import {
  getCachedPopularGames,
  getCachedSimilarGames,
} from "@/lib/games/cached-provider";
import {
  getGameIdentityKeys,
  getGameSlugIdentityKey,
  getRecommendations,
  isGameInIdentitySet,
  type Recommendation,
} from "@/lib/recommendations/scoring";
import type { LibraryEntry, RecommendationFeedback } from "@/lib/types";

const DISCOVERY_PAGE_SIZE = 50;
const DISCOVERY_SOURCE_PAGES = 4;
const TASTE_GENRE_LIMIT = 4;
const TASTE_PLATFORM_LIMIT = 3;
const SIMILAR_GAME_LIMIT = 5;

export interface DiscoveryCandidateBatch {
  games: GameSummary[];
  nextCursor: number;
}

interface DiscoveryCandidateInput {
  entries: LibraryEntry[];
  discoverySlugs: string[];
  feedback?: RecommendationFeedback[];
  cursor?: number;
  limit?: number;
}

interface RecommendationInput extends DiscoveryCandidateInput {
  limit: number;
}

type WeightedTerm = {
  value: string;
  score: number;
};

export async function getDiscoveryCandidateBatch({
  entries,
  discoverySlugs,
  feedback = [],
  cursor,
  limit = 60,
}: DiscoveryCandidateInput): Promise<DiscoveryCandidateBatch> {
  const startCursor = normalizeCursor(cursor, entries);
  const answeredGameKeys = getAnsweredGameKeys(entries, discoverySlugs);
  const candidates: GameSummary[] = [];
  const seenCandidateKeys = new Set<string>();
  let nextCursor = startCursor;

  for (
    let attempt = 0;
    attempt < 3 && candidates.length < limit;
    attempt += 1
  ) {
    const sourceGames = await loadCandidateSourceGames(entries, nextCursor);
    for (const game of sourceGames) {
      if (
        isGameInIdentitySet(game, answeredGameKeys) ||
        isGameInIdentitySet(game, seenCandidateKeys)
      ) {
        continue;
      }

      candidates.push(game);
      for (const key of getGameIdentityKeys(game)) {
        seenCandidateKeys.add(key);
      }
    }
    nextCursor += DISCOVERY_SOURCE_PAGES;
  }

  if (candidates.length === 0 && startCursor !== 1) {
    const fallbackGames = await loadCandidateSourceGames(entries, 1);
    for (const game of fallbackGames) {
      if (
        isGameInIdentitySet(game, answeredGameKeys) ||
        isGameInIdentitySet(game, seenCandidateKeys)
      ) {
        continue;
      }

      candidates.push(game);
      for (const key of getGameIdentityKeys(game)) {
        seenCandidateKeys.add(key);
      }
    }
  }

  return {
    games: rankDiscoveryGames(candidates, entries, feedback).slice(0, limit),
    nextCursor,
  };
}

export async function getRecommendationBatch({
  entries,
  discoverySlugs,
  feedback = [],
  cursor,
  limit,
}: RecommendationInput): Promise<Recommendation[]> {
  const batch = await getDiscoveryCandidateBatch({
    entries,
    discoverySlugs,
    feedback,
    cursor,
    limit: Math.max(limit * 6, 36),
  });
  const ranked = getRecommendations(batch.games, entries, limit, feedback);
  const rankedKeys = new Set<string>();
  for (const recommendation of ranked) {
    for (const key of getGameIdentityKeys(recommendation.game)) {
      rankedKeys.add(key);
    }
  }

  const fill = batch.games
    .filter((game) => !isGameInIdentitySet(game, rankedKeys))
    .slice(0, Math.max(0, limit - ranked.length))
    .map((game) => exploratoryRecommendation(game));

  return [...ranked, ...fill].slice(0, limit);
}

function normalizeCursor(cursor: number | undefined, entries: LibraryEntry[]) {
  if (cursor && Number.isInteger(cursor) && cursor > 0) {
    return Math.min(cursor, 200);
  }

  if (entries.length > 0) {
    return 1;
  }

  return Math.floor(Math.random() * 8) + 1;
}

function getAnsweredGameKeys(
  entries: LibraryEntry[],
  discoverySlugs: string[],
) {
  const keys = new Set(
    discoverySlugs.map((slug) => getGameSlugIdentityKey(slug)),
  );
  for (const entry of entries) {
    for (const key of getGameIdentityKeys(entry.game)) {
      keys.add(key);
    }
  }
  return keys;
}

async function loadCandidateSourceGames(
  entries: LibraryEntry[],
  cursor: number,
) {
  const topGenres = topTasteTerms(entries, "genres", TASTE_GENRE_LIMIT);
  const topPlatforms = topTasteTerms(
    entries,
    "platforms",
    TASTE_PLATFORM_LIMIT,
  );
  const highAffinityGames = entries
    .filter(
      (entry) =>
        entry.userGame.isFavorite || (entry.rating?.overallRating ?? 0) >= 7.5,
    )
    .slice(0, SIMILAR_GAME_LIMIT);
  const popularPages = Array.from(
    { length: DISCOVERY_SOURCE_PAGES },
    (_, index) => cursor + index,
  );
  const tastePage = Math.max(1, Math.ceil(cursor / 2));
  const requests: Array<Promise<GameSummary[]>> = [
    ...popularPages.map((page) =>
      getCachedPopularGames({ page, pageSize: DISCOVERY_PAGE_SIZE }),
    ),
    ...topGenres.map(({ value }, index) =>
      getCachedPopularGames({
        page: tastePage + index,
        pageSize: 30,
        genres: [value],
      }),
    ),
    ...topPlatforms.map(({ value }, index) =>
      getCachedPopularGames({
        page: tastePage + index,
        pageSize: 30,
        platforms: [value],
      }),
    ),
    ...highAffinityGames.map((entry) => getCachedSimilarGames(entry.game.id)),
  ];

  const results = await Promise.allSettled(requests);
  return results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
}

function topTasteTerms(
  entries: LibraryEntry[],
  key: "genres" | "platforms",
  limit: number,
): WeightedTerm[] {
  const scores = new Map<string, number>();
  for (const entry of entries) {
    const rating = entry.rating?.overallRating ?? 0;
    const statusWeight =
      entry.userGame.status === "playing"
        ? 2
        : entry.userGame.status === "want_to_play"
          ? 1.5
          : entry.userGame.status === "played"
            ? 1
            : 0.25;
    const ratingWeight =
      rating >= 9 ? 4 : rating >= 8 ? 3 : rating >= 7 ? 2 : rating > 0 ? 1 : 0;
    const favoriteWeight = entry.userGame.isFavorite ? 3 : 0;
    const weight = statusWeight + ratingWeight + favoriteWeight;

    for (const value of entry.game[key]) {
      scores.set(value, (scores.get(value) ?? 0) + weight);
    }
  }

  return Array.from(scores.entries())
    .map(([value, score]) => ({ value, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function rankDiscoveryGames(
  candidates: GameSummary[],
  entries: LibraryEntry[],
  feedback: RecommendationFeedback[],
) {
  if (entries.length === 0) {
    return exploratorySort(candidates);
  }

  const recommendations = getRecommendations(
    candidates,
    entries,
    candidates.length,
    feedback,
  );
  const recommendationKeys = new Set<string>();
  for (const recommendation of recommendations) {
    for (const key of getGameIdentityKeys(recommendation.game)) {
      recommendationKeys.add(key);
    }
  }

  return [
    ...recommendations.map((recommendation) => recommendation.game),
    ...exploratorySort(
      candidates.filter(
        (game) => !isGameInIdentitySet(game, recommendationKeys),
      ),
    ),
  ];
}

function exploratorySort(games: GameSummary[]) {
  return [...games].sort((a, b) => {
    const ratingDelta = (b.externalRating ?? 0) - (a.externalRating ?? 0);
    if (Math.abs(ratingDelta) > 0.01) {
      return ratingDelta;
    }

    return getReleaseTime(b) - getReleaseTime(a);
  });
}

function getReleaseTime(game: GameSummary) {
  return game.releaseDate ? new Date(game.releaseDate).getTime() : 0;
}

function exploratoryRecommendation(game: GameSummary): Recommendation {
  return {
    game,
    score: game.externalRating ?? 0,
    reasons: [
      "A strong discovery pick while Playnira keeps learning your taste.",
    ],
  };
}
