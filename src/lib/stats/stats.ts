import type { LibraryEntry } from "@/lib/types";
import { average, roundTo } from "@/lib/utils";

export interface UserStats {
  totalGamesPlayed: number;
  totalCompleted: number;
  totalDropped: number;
  averageOverallRating: number;
  backlogCount: number;
  mostRatedGenres: Array<{ label: string; value: number }>;
  favoriteGenres: Array<{ label: string; value: number }>;
  mostPlayedPlatforms: Array<{ label: string; value: number }>;
  ratingDistribution: Array<{ label: string; value: number }>;
  completedByYear: Array<{ label: string; value: number }>;
  completedThisYear: number;
}

function increment(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function topValues(map: Map<string, number>, limit = 5) {
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function calculateUserStats(
  entries: LibraryEntry[],
  now = new Date(),
): UserStats {
  const ratedEntries = entries.filter((entry) => entry.rating);
  const playedEntries = entries.filter(
    (entry) => entry.userGame.status === "played",
  );
  const completedEntries = entries.filter((entry) => entry.userGame.finished);
  const droppedEntries = entries.filter(
    (entry) => entry.userGame.status === "dropped",
  );
  const backlogEntries = entries.filter(
    (entry) => entry.userGame.status === "want_to_play",
  );
  const mostRatedGenres = new Map<string, number>();
  const favoriteGenres = new Map<string, number>();
  const mostPlayedPlatforms = new Map<string, number>();
  const ratingDistribution = new Map<string, number>();
  const completedByYear = new Map<string, number>();

  for (const entry of entries) {
    if (
      entry.userGame.status === "played" ||
      entry.userGame.status === "playing"
    ) {
      for (const platform of entry.game.platforms) {
        increment(mostPlayedPlatforms, platform);
      }
    }

    if (entry.rating) {
      const bucket = String(Math.round(entry.rating.overallRating));
      increment(ratingDistribution, bucket);

      for (const genre of entry.game.genres) {
        increment(mostRatedGenres, genre);
        if (entry.rating.overallRating >= 8) {
          increment(favoriteGenres, genre, entry.rating.overallRating);
        }
      }
    }

    if (entry.userGame.completedAt) {
      const year = new Date(entry.userGame.completedAt).getFullYear();
      if (!Number.isNaN(year)) {
        increment(completedByYear, String(year));
      }
    }
  }

  const currentYear = now.getFullYear();

  return {
    totalGamesPlayed: playedEntries.length,
    totalCompleted: completedEntries.length,
    totalDropped: droppedEntries.length,
    averageOverallRating: roundTo(
      average(ratedEntries.map((entry) => entry.rating?.overallRating ?? 0)),
      1,
    ),
    backlogCount: backlogEntries.length,
    mostRatedGenres: topValues(mostRatedGenres),
    favoriteGenres: topValues(favoriteGenres),
    mostPlayedPlatforms: topValues(mostPlayedPlatforms),
    ratingDistribution: Array.from({ length: 10 }, (_, index) => {
      const label = String(index + 1);
      return { label, value: ratingDistribution.get(label) ?? 0 };
    }),
    completedByYear: topValues(completedByYear, 8),
    completedThisYear: completedEntries.filter(
      (entry) =>
        entry.userGame.completedAt &&
        new Date(entry.userGame.completedAt).getFullYear() === currentYear,
    ).length,
  };
}

export type GamingPersonality =
  | "Story Explorer"
  | "Open-World Adventurer"
  | "Competitive Player"
  | "Strategy Mastermind"
  | "Completionist"
  | "Indie Discoverer"
  | "Casual Collector";

export interface PersonalityResult {
  label: GamingPersonality;
  explanation: string;
}

export function assignGamingPersonality(
  entries: LibraryEntry[],
): PersonalityResult {
  const stats = calculateUserStats(entries);
  const genreCounts = new Map<string, number>();
  const highlyRated = entries.filter(
    (entry) => (entry.rating?.overallRating ?? 0) >= 8,
  );

  for (const entry of highlyRated.length ? highlyRated : entries) {
    for (const genre of entry.game.genres) {
      increment(genreCounts, genre);
    }
  }

  const hasGenre = (genre: string) => (genreCounts.get(genre) ?? 0) >= 2;
  const completedRatio =
    stats.totalGamesPlayed === 0
      ? 0
      : stats.totalCompleted / stats.totalGamesPlayed;

  if (completedRatio >= 0.75 && stats.totalCompleted >= 3) {
    return {
      label: "Completionist",
      explanation: "You finish most of the games you mark as played.",
    };
  }

  if (hasGenre("Narrative") || hasGenre("RPG") || hasGenre("Adventure")) {
    return {
      label: "Story Explorer",
      explanation:
        "Your strongest ratings cluster around narrative and adventure games.",
    };
  }

  if (hasGenre("Open World")) {
    return {
      label: "Open-World Adventurer",
      explanation:
        "You keep gravitating toward large worlds and exploration-heavy games.",
    };
  }

  if (
    hasGenre("Competitive") ||
    hasGenre("Shooter") ||
    hasGenre("Battle Royale")
  ) {
    return {
      label: "Competitive Player",
      explanation:
        "Your library leans toward fast multiplayer and competitive games.",
    };
  }

  if (hasGenre("Strategy") || hasGenre("Tactics") || hasGenre("4X")) {
    return {
      label: "Strategy Mastermind",
      explanation:
        "Your ratings point toward tactical planning and long-term strategy.",
    };
  }

  if (hasGenre("Indie")) {
    return {
      label: "Indie Discoverer",
      explanation:
        "You often reward smaller, distinctive games with strong ratings.",
    };
  }

  return {
    label: "Casual Collector",
    explanation:
      "Your library is broad, varied, and still finding its favorite lane.",
  };
}
