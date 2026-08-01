import type { GameSummary } from "@/lib/games/types";
import type { LibraryEntry, Rating, RecommendationFeedback } from "@/lib/types";
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
  excludedGameKeys: Set<string>;
  answeredGameKeys: Set<string>;
  highRatedGames: GameSummary[];
  feedback: {
    hiddenGameKeys: Set<string>;
    showLessGameKeys: Set<string>;
    showMoreGameKeys: Set<string>;
    preferShorter: boolean;
    preferredPlatforms: Set<string>;
  };
}

function addWeight(map: Map<string, number>, key: string, amount: number) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

export function getGameSlugIdentityKey(slug: string) {
  return `slug:${slug.toLowerCase()}`;
}

function normalizedTitleKey(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getReleaseYear(game: GameSummary) {
  return game.releaseDate ? new Date(game.releaseDate).getFullYear() : null;
}

function metadataValue(game: GameSummary, key: string) {
  const value = game.metadata[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : null;
}

export function getGameIdentityKeys(game: GameSummary) {
  const keys = new Set<string>();
  const titleKey = normalizedTitleKey(game.title);
  const releaseYear = getReleaseYear(game);
  const igdbId = metadataValue(game, "igdbId");
  const igdbSlug = metadataValue(game, "igdbSlug");
  const sourceSlug = metadataValue(game, "sourceSlug");

  keys.add(`id:${game.id}`);
  keys.add(`provider:${game.provider}:${game.providerGameId}`);
  keys.add(getGameSlugIdentityKey(game.slug));

  if (igdbId) {
    keys.add(`igdb:${igdbId}`);
  }
  if (igdbSlug) {
    keys.add(getGameSlugIdentityKey(igdbSlug));
  }
  if (sourceSlug) {
    keys.add(getGameSlugIdentityKey(sourceSlug));
  }
  if (titleKey && releaseYear) {
    keys.add(`title-year:${titleKey}:${releaseYear}`);
  }

  return Array.from(keys);
}

export function isGameInIdentitySet(
  game: GameSummary,
  gameIdentityKeys: Set<string>,
) {
  return getGameIdentityKeys(game).some((key) => gameIdentityKeys.has(key));
}

export function buildRecommendationProfile(
  entries: LibraryEntry[],
  feedback: RecommendationFeedback[] = [],
): RecommendationProfile {
  const favoriteGenres = new Map<string, number>();
  const preferredPlatforms = new Map<string, number>();
  const favoriteGameIds = new Set<string>();
  const excludedGameIds = new Set<string>();
  const answeredGameIds = new Set<string>();
  const excludedGameKeys = new Set<string>();
  const answeredGameKeys = new Set<string>();
  const highRatedGames: GameSummary[] = [];
  const preferredYears: number[] = [];
  const feedbackProfile = {
    hiddenGameKeys: new Set<string>(),
    showLessGameKeys: new Set<string>(),
    showMoreGameKeys: new Set<string>(),
    preferShorter: false,
    preferredPlatforms: new Set<string>(),
  };

  for (const entry of entries) {
    const rating = entry.rating?.overallRating ?? 0;
    const status = entry.userGame.status;
    answeredGameIds.add(entry.game.id);
    for (const key of getGameIdentityKeys(entry.game)) {
      answeredGameKeys.add(key);
    }

    if (status === "not_interested") {
      excludedGameIds.add(entry.game.id);
      for (const key of getGameIdentityKeys(entry.game)) {
        excludedGameKeys.add(key);
      }
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

  for (const item of feedback) {
    const key = getGameSlugIdentityKey(item.gameSlug);
    if (item.action === "hide_game") {
      feedbackProfile.hiddenGameKeys.add(key);
    }
    if (item.action === "show_less") {
      feedbackProfile.showLessGameKeys.add(key);
    }
    if (item.action === "show_more") {
      feedbackProfile.showMoreGameKeys.add(key);
    }
    if (item.action === "prefer_shorter") {
      feedbackProfile.preferShorter = true;
    }
    if (item.action === "prefer_platform" && item.platform) {
      feedbackProfile.preferredPlatforms.add(item.platform);
    }
  }

  return {
    favoriteGenres,
    preferredPlatforms,
    preferredYears,
    favoriteGameIds,
    excludedGameIds,
    answeredGameIds,
    excludedGameKeys,
    answeredGameKeys,
    highRatedGames,
    feedback: feedbackProfile,
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

function overlappingHighRatedGame(
  game: GameSummary,
  highRatedGames: GameSummary[],
) {
  return highRatedGames.find((ratedGame) => {
    const genreOverlap = game.genres.some((genre) =>
      ratedGame.genres.includes(genre),
    );
    const platformOverlap = game.platforms.some((platform) =>
      ratedGame.platforms.includes(platform),
    );

    return genreOverlap && platformOverlap;
  });
}

export function scoreGameForRecommendation(
  game: GameSummary,
  profile: RecommendationProfile,
): Recommendation {
  if (
    profile.excludedGameIds.has(game.id) ||
    isGameInIdentitySet(game, profile.excludedGameKeys) ||
    isGameInIdentitySet(game, profile.feedback.hiddenGameKeys)
  ) {
    return {
      game,
      score: Number.NEGATIVE_INFINITY,
      reasons: ["Excluded because you marked it as not interested."],
    };
  }

  if (
    profile.answeredGameIds.has(game.id) ||
    isGameInIdentitySet(game, profile.answeredGameKeys)
  ) {
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
  const rankedMatchingGenres = matchingGenres.sort(
    (a, b) =>
      (profile.favoriteGenres.get(b) ?? 0) -
      (profile.favoriteGenres.get(a) ?? 0),
  );
  for (const genre of rankedMatchingGenres) {
    score += (profile.favoriteGenres.get(genre) ?? 0) * 2;
  }

  if (rankedMatchingGenres.length > 1) {
    reasons.push(
      `Recommended because it shares ${rankedMatchingGenres.slice(0, 2).join(" and ")} with games you rated highly.`,
    );
  } else if (rankedMatchingGenres.length === 1) {
    reasons.push(
      `Recommended because ${rankedMatchingGenres[0]} is one of your stronger genres.`,
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

  const feedbackPlatforms = game.platforms.filter((platform) =>
    profile.feedback.preferredPlatforms.has(platform),
  );
  if (feedbackPlatforms.length) {
    score += feedbackPlatforms.length * 2;
    reasons.push(
      `Boosted because you asked for more ${feedbackPlatforms.slice(0, 2).join(", ")} recommendations.`,
    );
  }

  const externalRating = game.externalRating ?? 0;
  if (externalRating >= 8.5) {
    score += 3;
    reasons.push("It also has a strong external rating.");
  } else if (externalRating >= 7.5) {
    score += 1.5;
    reasons.push("Its external rating is solid enough to be worth a look.");
  }

  if (profile.feedback.preferShorter && game.estimatedPlaytime) {
    if (game.estimatedPlaytime <= 15) {
      score += 2.5;
      reasons.push("Boosted because you asked for shorter games.");
    } else if (game.estimatedPlaytime >= 45) {
      score -= 1.5;
    }
  }

  if (isGameInIdentitySet(game, profile.feedback.showMoreGameKeys)) {
    score += 3;
    reasons.push(
      "Boosted because you asked for more recommendations like this.",
    );
  }

  if (isGameInIdentitySet(game, profile.feedback.showLessGameKeys)) {
    score -= 5;
    reasons.push("Lowered because you asked to see less like this.");
  }

  const releaseYearScore = yearAffinity(game, profile.preferredYears);
  if (releaseYearScore > 0) {
    score += releaseYearScore;
    if (releaseYearScore >= 1.25) {
      reasons.push("Its release era matches games you tend to rate well.");
    }
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
  if (similarityBoost >= 1.5) {
    const source = overlappingHighRatedGame(game, profile.highRatedGames);
    reasons.push(
      source
        ? `It looks close to ${source.title}, one of your stronger ratings.`
        : "It overlaps with multiple games you rated highly.",
    );
  }

  if (reasons.length === 0) {
    reasons.push("Recommended as a fresh pick from the Playnira catalog.");
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
  feedback: RecommendationFeedback[] = [],
) {
  const profile = buildRecommendationProfile(entries, feedback);
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
  recommendationCount = 1,
) {
  const nextGameClause =
    recommendationCount > 1
      ? "here are a few games you may like."
      : recommendationCount === 1
        ? "here is another game you may like."
        : "keep exploring and Playnira will keep learning your taste.";
  const sourceGenres = source?.genres.slice(0, 2).join(" and ").toLowerCase();
  const sourceClause = sourceGenres
    ? ` Because you enjoyed ${sourceGenres}, ${nextGameClause}`
    : ` ${nextGameClause.charAt(0).toUpperCase()}${nextGameClause.slice(1)}`;

  return `You rated ${gameTitle} an ${rating.overallRating}/10.${sourceClause}`;
}
