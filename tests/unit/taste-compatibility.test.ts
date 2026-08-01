import { describe, expect, it } from "vitest";
import { calculateTasteCompatibility } from "@/lib/community/compatibility";
import type { LibraryEntry } from "@/lib/types";

function entry(
  slug: string,
  genres: string[],
  platforms: string[],
  rating: number,
): LibraryEntry {
  return {
    game: {
      id: slug,
      provider: "seed",
      providerGameId: slug,
      slug,
      title: slug,
      description: "",
      coverImageUrl: null,
      backgroundImageUrl: null,
      releaseDate: "2026-01-01",
      genres,
      platforms,
      developer: null,
      publisher: null,
      externalRating: null,
      estimatedPlaytime: null,
      screenshots: [],
      metadata: {},
    },
    userGame: {
      gameId: slug,
      status: "played",
      isFavorite: rating >= 9,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    rating: {
      gameId: slug,
      overallRating: rating,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  };
}

describe("taste compatibility", () => {
  it("scores shared highly rated genres, platforms, and game decisions", () => {
    const compatibility = calculateTasteCompatibility(
      [entry("outer-wilds", ["Adventure"], ["PC"], 10)],
      [entry("outer-wilds", ["Adventure"], ["PC"], 9)],
    );

    expect(compatibility?.score).toBeGreaterThan(25);
    expect(compatibility?.reasons.join(" ")).toMatch(/genre|platform|game/i);
  });

  it("returns null when there is not enough library data", () => {
    expect(calculateTasteCompatibility([], [])).toBeNull();
  });
});
