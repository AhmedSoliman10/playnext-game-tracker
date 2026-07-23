import { describe, expect, it } from "vitest";
import { seedGames } from "@/lib/games/seed-data";
import { filterLibraryEntries } from "@/lib/library/filter";
import { getRecommendations } from "@/lib/recommendations/scoring";
import {
  applyFavoriteUpdate,
  applyLibraryRemoval,
  applyRatingSave,
  applyStatusUpdate,
  createEmptyLibraryState,
  toLibraryEntries,
} from "@/lib/server/library-core";

function game(slug: string) {
  const found = seedGames.find((candidate) => candidate.slug === slug);
  if (!found) {
    throw new Error(`Missing seed game ${slug}`);
  }
  return found;
}

describe("library integration rules", () => {
  it("creates and updates a user-game status without duplicating entries", () => {
    const state = createEmptyLibraryState();
    applyStatusUpdate(state, game("hades"), {
      gameSlug: "hades",
      status: "want_to_play",
    });
    applyStatusUpdate(state, game("hades"), {
      gameSlug: "hades",
      status: "playing",
    });

    expect(Object.keys(state.userGames)).toEqual(["hades"]);
    expect(state.userGames.hades.status).toBe("playing");
  });

  it("saves and updates a rating while preventing duplicate rating records", () => {
    const state = createEmptyLibraryState();
    applyRatingSave(state, game("hades"), {
      gameSlug: "hades",
      overallRating: 8,
      storyRating: null,
      gameplayRating: 9,
      visualsRating: null,
      soundtrackRating: null,
      difficultyRating: null,
      wouldRecommend: true,
      finished: true,
      review: "Fast and polished.",
    });
    applyRatingSave(state, game("hades"), {
      gameSlug: "hades",
      overallRating: 9,
      storyRating: null,
      gameplayRating: 10,
      visualsRating: null,
      soundtrackRating: null,
      difficultyRating: null,
      wouldRecommend: true,
      finished: true,
      review: "Even better on replay.",
    });

    expect(Object.keys(state.ratings)).toEqual(["hades"]);
    expect(state.ratings.hades.overallRating).toBe(9);
    expect(state.userGames.hades.status).toBe("played");
  });

  it("filters library entries by status and favorites", () => {
    const state = createEmptyLibraryState();
    applyStatusUpdate(state, game("hades"), {
      gameSlug: "hades",
      status: "played",
      isFavorite: true,
    });
    applyStatusUpdate(state, game("celeste"), {
      gameSlug: "celeste",
      status: "want_to_play",
    });
    const entries = toLibraryEntries(
      state,
      new Map(
        [game("hades"), game("celeste")].map((candidate) => [
          candidate.slug,
          candidate,
        ]),
      ),
    );

    expect(
      filterLibraryEntries(entries, "played").map((entry) => entry.game.slug),
    ).toEqual(["hades"]);
    expect(
      filterLibraryEntries(entries, "favorites").map(
        (entry) => entry.game.slug,
      ),
    ).toEqual(["hades"]);
    expect(
      filterLibraryEntries(entries, "want_to_play").map(
        (entry) => entry.game.slug,
      ),
    ).toEqual(["celeste"]);
  });

  it("keeps skipped games out of the library while remembering discovery history", () => {
    const state = createEmptyLibraryState();
    const userGame = applyStatusUpdate(state, game("hades"), {
      gameSlug: "hades",
      status: "skipped",
    });
    const entries = toLibraryEntries(
      state,
      new Map([[game("hades").slug, game("hades")]]),
    );

    expect(userGame).toBeNull();
    expect(state.userGames.hades).toBeUndefined();
    expect(state.discoveryInteractions.hades).toBe("skipped");
    expect(entries).toEqual([]);
  });

  it("uses want-to-play as the first library status when favoriting a new game", () => {
    const state = createEmptyLibraryState();
    applyFavoriteUpdate(state, game("hades"), {
      gameSlug: "hades",
      isFavorite: true,
    });

    expect(state.userGames.hades.status).toBe("want_to_play");
    expect(state.userGames.hades.isFavorite).toBe(true);
  });

  it("removes a game status and rating from the user's library", () => {
    const state = createEmptyLibraryState();
    applyRatingSave(state, game("hades"), {
      gameSlug: "hades",
      overallRating: 9,
      storyRating: null,
      gameplayRating: 9,
      visualsRating: null,
      soundtrackRating: null,
      difficultyRating: null,
      wouldRecommend: true,
      finished: true,
      review: "Great run-based action.",
    });

    const removed = applyLibraryRemoval(state, { gameSlug: "hades" });

    expect(removed).toBe(true);
    expect(state.userGames.hades).toBeUndefined();
    expect(state.ratings.hades).toBeUndefined();
  });

  it("excludes not-interested games from recommendations", () => {
    const state = createEmptyLibraryState();
    applyRatingSave(state, game("hades"), {
      gameSlug: "hades",
      overallRating: 9,
      finished: true,
      storyRating: null,
      gameplayRating: 10,
      visualsRating: null,
      soundtrackRating: null,
      difficultyRating: null,
      wouldRecommend: true,
      review: null,
    });
    applyStatusUpdate(state, game("elden-ring"), {
      gameSlug: "elden-ring",
      status: "not_interested",
    });
    const entries = toLibraryEntries(
      state,
      new Map(
        [game("hades"), game("elden-ring")].map((candidate) => [
          candidate.slug,
          candidate,
        ]),
      ),
    );

    const recommendations = getRecommendations(seedGames, entries, 30);

    expect(
      recommendations.some(
        (recommendation) => recommendation.game.slug === "elden-ring",
      ),
    ).toBe(false);
    expect(
      recommendations.some(
        (recommendation) => recommendation.game.slug === "hades",
      ),
    ).toBe(false);
  });
});
