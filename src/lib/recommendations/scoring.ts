import type { GameSummary } from "@/lib/games/types";
import type { LibraryEntry, Rating } from "@/lib/types";
import { average, roundTo } from "@/lib/utils";

export interface Recommendation {
  game: GameSummary;
  score: number;
  reasons: string[];
}

export interface RecommendationProfile {
  favoriteGenres: Map<string, number>;
  preferredPlatforms: Map<string, number>;
  preferredYears: number[];
  favoriteGameIds: Set<string>;
  excludedGameIds: Set<string>;
  answeredGameIds: Set<string>;
  highRatedGames: GameSummary[];
}

function addWeight(map: Map<string, number>, key: string, amount: number) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

export function buildRecommendationProfile(
  entries: LibraryEntry[],
): RecommendationProfile {
  const favoriteGenres = new Map<string, number>();
  const preferredPlatforms = new Map<string, number>();
  const favoriteGameIds = new Set<string>();
  const excludedGameIds = new Set<string>();
  const answeredGameIds = new Set<string>();
  const highRatedGames: GameSummary[] = [];
  const preferredYears: number[] = [];

  for (const entry of entries) {
    const rating = entry.rating?.overallRating ?? 0;
    const status = entry.userGame.status;
    answeredGameIds.add(entry.game.id);

    if (status === "not_interested") {
      excludedGameIds.add(entry.game.id);
      continue;
    }

    if (entry.userGame.isFavorite) {
      favoriteGameIds.add(entry.game.id);
    }

    const ratingWeight =
      rating >= 8 ? 3 : rating >= 7 ? 2 : status === "played" ? 1 : 0.5;
    if (rating >= 8 || entry.userGame.isFavorite) {
      highRatedGames.push(entry.game);
    }

    for (const genre of entry.game.genres) {
      addWeight(
        favoriteGenres,
        genre,
        ratingWeight + (entry.userGame.isFavorite ? 1 : 0),
      );
    }

    for (const platform of entry.game.platforms) {
      addWeight(preferredPlatforms, platform, status === "playing" ? 2 : 1);
    }

    const year = entry.game.releaseDate
      ? new Date(entry.game.releaseDate).getFullYear()
      : null;
    if (year && rating >= 7) {
      preferredYears.push(year);
    }
  }

  return {
    favoriteGenres,
    preferredPlatforms,
    preferredYears,
    favoriteGameIds,
    excludedGameIds,
    answeredGameIds,
    highRatedGames,
  };
}

function yearAffinity(game: GameSummary, preferredYears: number[]) {
  if (!game.releaseDate || preferredYears.length === 0) {
    return 0;
  }

  const gameYear = new Date(game.releaseDate).getFullYear();
  const preferredAverage = average(preferredYears);
  const distance = Math.abs(gameYear - preferredAverage);
  return Math.max(0, 2 - distance / 8);
}

export function scoreGameForRecommendation(
  game: GameSummary,
  profile: RecommendationProfile,
): Recommendation {
  if (profile.excludedGameIds.has(game.id)) {
    return {
      game,
      score: Number.NEGATIVE_INFINITY,
      reasons: ["Excluded because you marked it as not interested."],
    };
  }

  if (profile.answeredGameIds.has(game.id)) {
    return {
      game,
      score: Number.NEGATIVE_INFINITY,
      reasons: ["Excluded because it is already in your library."],
    };
  }

  const reasons: string[] = [];
  let score = 0;

  const matchingGenres = game.genres.filter((genre) =>
    profile.favoriteGenres.has(genre),
  );
  for (const genre of matchingGenres) {
    score += (profile.favoriteGenres.get(genre) ?? 0) * 2;
  }

  if (matchingGenres.length > 0) {
    reasons.push(
      `Recommended because you rated ${matchingGenres.slice(0, 2).join(" and ")} games highly.`,
    );
  }

  const matchingPlatforms = game.platforms.filter((platform) =>
    profile.preferredPlatforms.has(platform),
  );
  score += matchingPlatforms.length * 1.5;
  if (matchingPlatforms.length > 0) {
    reasons.push(
      `Available on platforms you already use: ${matchingPlatforms.slice(0, 2).join(", ")}.`,
    );
  }

  const externalRating = game.externalRating ?? 0;
  if (externalRating >= 8.5) {
    score += 3;
    reasons.push("It also has a strong external rating.");
  } else if (externalRating >= 7.5) {
    score += 1.5;
  }

  const releaseYearScore = yearAffinity(game, profile.preferredYears);
  if (releaseYearScore > 0) {
    score += releaseYearScore;
  }

  const similarityBoost = profile.highRatedGames.reduce((sum, ratedGame) => {
    const genreOverlap = game.genres.filter((genre) =>
      ratedGame.genres.includes(genre),
    ).length;
    const platformOverlap = game.platforms.filter((platform) =>
      ratedGame.platforms.includes(platform),
    ).length;
    return sum + genreOverlap * 0.8 + platformOverlap * 0.25;
  }, 0);
  score += Math.min(similarityBoost, 4);

  if (reasons.length === 0) {
    reasons.push("Recommended as a fresh pick from the PlayNext catalog.");
  }

  return {
    game,
    score: roundTo(score, 2),
    reasons,
  };
}

export function getRecommendations(
  candidates: GameSummary[],
  entries: LibraryEntry[],
  limit = 8,
) {
  const profile = buildRecommendationProfile(entries);
  return candidates
    .map((game) => scoreGameForRecommendation(game, profile))
    .filter((recommendation) => Number.isFinite(recommendation.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function recommendationMessage(
  gameTitle: string,
  rating: Rating,
  source?: GameSummary,
) {
  const sourceClause = source
    ? ` Because you enjoyed ${source.genres.slice(0, 2).join(" and ").toLowerCase()}, here is another game you may like.`
    : " Here is another game you may like.";

  return `You rated ${gameTitle} an ${rating.overallRating}/10.${sourceClause}`;
}
