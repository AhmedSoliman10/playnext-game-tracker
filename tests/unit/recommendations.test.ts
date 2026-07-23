import { describe, expect, it } from "vitest";
import { seedGames } from "@/lib/games/seed-data";
import {
  buildRecommendationProfile,
  getRecommendations,
  scoreGameForRecommendation,
} from "@/lib/recommendations/scoring";
import type { LibraryEntry } from "@/lib/types";

function entry(
  slug: string,
  overrides: Partial<LibraryEntry> = {},
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
      finished: true,
      startedAt: null,
      completedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    rating: {
      gameId: game.id,
      overallRating: 9,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    ...overrides,
  };
}

describe("recommendation scoring", () => {
  it("boosts games that match highly rated genres and platforms", () => {
    const profile = buildRecommendationProfile([
      entry("the-witcher-3-wild-hunt"),
      entry("red-dead-redemption-2", {
        userGame: {
          ...entry("red-dead-redemption-2").userGame,
          isFavorite: true,
        },
      }),
    ]);
    const zelda = seedGames.find(
      (game) => game.slug === "the-legend-of-zelda-breath-of-the-wild",
    )!;

    const result = scoreGameForRecommendation(zelda, profile);

    expect(result.score).toBeGreaterThan(8);
    expect(result.reasons.join(" ")).toMatch(/Adventure|Open World/i);
    expect(result.reasons.join(" ")).toMatch(/external rating/i);
    expect(result.reasons.join(" ")).toMatch(/release era/i);
  });

  it("does not recommend games already answered or marked not interested", () => {
    const notInterested = entry("elden-ring", {
      userGame: { ...entry("elden-ring").userGame, status: "not_interested" },
      rating: null,
    });
    const recommendations = getRecommendations(
      seedGames,
      [entry("hades"), notInterested],
      20,
    );

    expect(recommendations.some((item) => item.game.slug === "hades")).toBe(
      false,
    );
    expect(
      recommendations.some((item) => item.game.slug === "elden-ring"),
    ).toBe(false);
  });

  it("does not recommend the same library game when provider identifiers differ", () => {
    const playedHades = entry("hades");
    const igdbDuplicate = {
      ...playedHades.game,
      id: "999999",
      provider: "igdb" as const,
      providerGameId: "999999",
      slug: "hades-igdb",
      metadata: { igdbId: 999999 },
    };
    const zelda = seedGames.find(
      (game) => game.slug === "the-legend-of-zelda-breath-of-the-wild",
    )!;

    const recommendations = getRecommendations(
      [igdbDuplicate, zelda],
      [playedHades],
      10,
    );

    expect(
      recommendations.some(
        (recommendation) => recommendation.game.id === igdbDuplicate.id,
      ),
    ).toBe(false);
    expect(recommendations.map((item) => item.game.slug)).toContain(zelda.slug);
  });
});
