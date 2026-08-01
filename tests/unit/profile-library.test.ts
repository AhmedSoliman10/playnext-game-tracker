import { describe, expect, it } from "vitest";
import {
  getProfileLibraryEntries,
  getProfileLibraryTabs,
  getRatingCategoryAverages,
  parseProfileLibraryQuery,
  type ProfileLibraryQuery,
} from "@/lib/profile/library";
import type { LibraryEntry } from "@/lib/types";

describe("profile library helpers", () => {
  it("filters profile libraries by status and search text", () => {
    const query: ProfileLibraryQuery = {
      view: "want_to_play",
      q: "Switch",
      sort: "recent",
    };

    expect(
      getProfileLibraryEntries(entries, query, { includeHidden: false }).map(
        (entry) => entry.game.title,
      ),
    ).toEqual(["Metroid Prime 4"]);
  });

  it("does not allow public visitors to force the hidden tab", () => {
    const parsed = parseProfileLibraryQuery(
      { view: "hidden" },
      { allowHidden: false },
    );

    expect(parsed.view).toBe("all");
    expect(
      getProfileLibraryTabs(entries, { includeHidden: false }).some(
        (tab) => tab.view === "hidden",
      ),
    ).toBe(false);
  });

  it("sorts by highest user rating", () => {
    const results = getProfileLibraryEntries(
      entries,
      { view: "played", q: "", sort: "rating" },
      { includeHidden: true },
    );

    expect(results.map((entry) => entry.game.title)).toEqual([
      "Outer Wilds",
      "Celeste",
    ]);
  });

  it("calculates category averages for rich profile taste breakdowns", () => {
    expect(getRatingCategoryAverages(entries)).toEqual([
      { label: "Story", value: 9 },
      { label: "Gameplay", value: 8.5 },
      { label: "Visuals", value: 8 },
      { label: "Soundtrack", value: 9 },
      { label: "Difficulty", value: 7 },
    ]);
  });
});

const now = new Date("2026-08-01T12:00:00.000Z").toISOString();

const entries: LibraryEntry[] = [
  {
    game: {
      id: "outer-wilds",
      provider: "seed",
      providerGameId: "outer-wilds",
      slug: "outer-wilds",
      title: "Outer Wilds",
      description: "A clockwork mystery in space.",
      coverImageUrl: null,
      backgroundImageUrl: null,
      releaseDate: "2019-05-28",
      genres: ["Adventure"],
      platforms: ["PC"],
      developer: "Mobius Digital",
      publisher: "Annapurna Interactive",
      externalRating: 9.1,
      estimatedPlaytime: 16,
      screenshots: [],
      metadata: {},
    },
    userGame: {
      gameId: "outer-wilds",
      status: "played",
      isFavorite: true,
      createdAt: now,
      updatedAt: "2026-08-01T12:00:00.000Z",
    },
    rating: {
      gameId: "outer-wilds",
      overallRating: 10,
      storyRating: 10,
      gameplayRating: 9,
      visualsRating: 8,
      soundtrackRating: 10,
      difficultyRating: 6,
      wouldRecommend: true,
      review: "The comment that should show everywhere.",
      createdAt: now,
      updatedAt: now,
    },
  },
  {
    game: {
      id: "celeste",
      provider: "seed",
      providerGameId: "celeste",
      slug: "celeste",
      title: "Celeste",
      description: "Precision platforming.",
      coverImageUrl: null,
      backgroundImageUrl: null,
      releaseDate: "2018-01-25",
      genres: ["Platformer"],
      platforms: ["PC"],
      developer: "Maddy Makes Games",
      publisher: "Maddy Makes Games",
      externalRating: 9,
      estimatedPlaytime: 8,
      screenshots: [],
      metadata: {},
    },
    userGame: {
      gameId: "celeste",
      status: "played",
      isFavorite: false,
      createdAt: now,
      updatedAt: "2026-07-01T12:00:00.000Z",
    },
    rating: {
      gameId: "celeste",
      overallRating: 8,
      storyRating: 8,
      gameplayRating: 8,
      visualsRating: 8,
      soundtrackRating: 8,
      difficultyRating: 8,
      wouldRecommend: true,
      review: null,
      createdAt: now,
      updatedAt: now,
    },
  },
  {
    game: {
      id: "metroid-prime-4",
      provider: "seed",
      providerGameId: "metroid-prime-4",
      slug: "metroid-prime-4",
      title: "Metroid Prime 4",
      description: "Sci-fi exploration.",
      coverImageUrl: null,
      backgroundImageUrl: null,
      releaseDate: "2026-12-31",
      genres: ["Adventure"],
      platforms: ["Nintendo Switch"],
      developer: "Retro Studios",
      publisher: "Nintendo",
      externalRating: null,
      estimatedPlaytime: null,
      screenshots: [],
      metadata: {},
    },
    userGame: {
      gameId: "metroid-prime-4",
      status: "want_to_play",
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    },
    rating: null,
  },
  {
    game: {
      id: "hidden-game",
      provider: "seed",
      providerGameId: "hidden-game",
      slug: "hidden-game",
      title: "Hidden Game",
      description: "Not interested.",
      coverImageUrl: null,
      backgroundImageUrl: null,
      releaseDate: null,
      genres: ["Action"],
      platforms: ["PC"],
      developer: null,
      publisher: null,
      externalRating: null,
      estimatedPlaytime: null,
      screenshots: [],
      metadata: {},
    },
    userGame: {
      gameId: "hidden-game",
      status: "not_interested",
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    },
    rating: null,
  },
];
