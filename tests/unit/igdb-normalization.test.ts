import { describe, expect, it } from "vitest";
import {
  getIgdbSearchQueries,
  igdbGameSchema,
  normalizeIgdbGame,
} from "@/lib/games/igdb-provider";

describe("IGDB normalization", () => {
  it("validates and normalizes covers, screenshots, ratings, and companies", () => {
    const parsed = igdbGameSchema.parse({
      id: 1942,
      slug: "sample-igdb-game",
      name: "Sample IGDB Game",
      summary: "External IGDB summary",
      cover: { image_id: "co1234" },
      first_release_date: 1_704_067_200,
      genres: [{ name: "Adventure" }],
      platforms: [{ name: "PC" }],
      themes: [{ name: "Open world" }],
      keywords: [{ name: "exploration" }],
      game_modes: [{ name: "Single player" }],
      involved_companies: [
        { developer: true, company: { name: "Sample Developer" } },
        { publisher: true, company: { name: "Sample Publisher" } },
      ],
      total_rating: 86.4,
      total_rating_count: 120,
      screenshots: [{ image_id: "sc1234" }],
      artworks: [{ image_id: "ar1234" }],
    });

    const game = normalizeIgdbGame(parsed);

    expect(game.provider).toBe("igdb");
    expect(game.coverImageUrl).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1234.jpg",
    );
    expect(game.backgroundImageUrl).toBe(
      "https://images.igdb.com/igdb/image/upload/t_1080p/ar1234.jpg",
    );
    expect(game.screenshots).toEqual([
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc1234.jpg",
    ]);
    expect(game.externalRating).toBe(8.6);
    expect(game.developer).toBe("Sample Developer");
    expect(game.publisher).toBe("Sample Publisher");
    expect(game.releaseDate).toBe("2024-01-01");
    expect(game.metadata.igdbThemes).toEqual(["Open world"]);
    expect(game.metadata.igdbKeywords).toEqual(["exploration"]);
    expect(game.metadata.igdbGameModes).toEqual(["Single player"]);
  });

  it("adds spelling-tolerant search fallbacks for common title mistakes", () => {
    expect(getIgdbSearchQueries("dinner dash")).toContain("diner dash");
  });

  it("uses the preferred IGDB hero artwork for the landing featured Red Dead card", () => {
    const parsed = igdbGameSchema.parse({
      id: 25076,
      slug: "red-dead-redemption-2",
      name: "Red Dead Redemption 2",
      summary: "A frontier story.",
      artworks: [
        { image_id: "nqtsfctiapng5xcmozyk", width: 3840, height: 2160 },
        { image_id: "ar3qmt", width: 3840, height: 2160 },
      ],
    });

    const game = normalizeIgdbGame(parsed);

    expect(game.backgroundImageUrl).toBe(
      "https://images.igdb.com/igdb/image/upload/t_1080p/ar3qmt.jpg",
    );
  });

  it("handles missing optional artwork and creates a stable fallback slug", () => {
    const parsed = igdbGameSchema.parse({
      id: 77,
      name: "Edge Case Game",
      summary: null,
      storyline: "A short original storyline.",
      first_release_date: null,
      involved_companies: [
        { developer: true },
        { publisher: true, company: { name: "Known Publisher" } },
      ],
      rating: 72.2,
    });

    const game = normalizeIgdbGame(parsed);

    expect(game.slug).toBe("edge-case-game-77");
    expect(game.description).toBe("A short original storyline.");
    expect(game.coverImageUrl).toBeNull();
    expect(game.backgroundImageUrl).toBeNull();
    expect(game.screenshots).toEqual([]);
    expect(game.releaseDate).toBeNull();
    expect(game.developer).toBeNull();
    expect(game.publisher).toBe("Known Publisher");
    expect(game.externalRating).toBe(7.2);
  });

  it("rejects malformed IGDB rows before they reach the application", () => {
    expect(() =>
      igdbGameSchema.parse({
        id: "not-a-number",
        name: "Broken Game",
      }),
    ).toThrow();
  });
});
