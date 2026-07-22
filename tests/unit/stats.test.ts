import { describe, expect, it } from "vitest";
import { seedGames } from "@/lib/games/seed-data";
import { calculateUserStats, assignGamingPersonality } from "@/lib/stats/stats";
import type { LibraryEntry } from "@/lib/types";

function makeEntry(
  slug: string,
  rating: number,
  finished = true,
): LibraryEntry {
  const game = seedGames.find((candidate) => candidate.slug === slug);
  if (!game) {
    throw new Error(`Missing seed game ${slug}`);
  }
  return {
    game,
    userGame: {
      gameId: game.id,
      status: "played",
      isFavorite: false,
      finished,
      startedAt: null,
      completedAt: finished ? "2026-03-01T00:00:00.000Z" : null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    },
    rating: {
      gameId: game.id,
      overallRating: rating,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    },
  };
}

describe("statistics", () => {
  it("calculates totals, averages, distributions, and yearly completions", () => {
    const stats = calculateUserStats(
      [makeEntry("the-witcher-3-wild-hunt", 9), makeEntry("hades", 8)],
      new Date("2026-07-18T00:00:00.000Z"),
    );

    expect(stats.totalGamesPlayed).toBe(2);
    expect(stats.averageOverallRating).toBe(8.5);
    expect(stats.completedThisYear).toBe(2);
    expect(
      stats.ratingDistribution.find((bucket) => bucket.label === "9")?.value,
    ).toBe(1);
  });

  it("assigns a transparent gaming personality", () => {
    const personality = assignGamingPersonality([
      makeEntry("the-witcher-3-wild-hunt", 9),
      makeEntry("baldurs-gate-3", 9),
      makeEntry("disco-elysium", 8),
    ]);

    expect(personality.label).toBe("Completionist");
    expect(personality.explanation).toMatch(/finish/i);
  });
});
