import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PopularNowCarousel } from "@/components/games/popular-now-carousel";
import type { GameSummary } from "@/lib/games/types";

const games: GameSummary[] = Array.from({ length: 3 }, (_, index) => ({
  id: `game-${index}`,
  provider: "seed",
  providerGameId: `game-${index}`,
  slug: `game-${index}`,
  title: `Game ${index}`,
  description: "A popular game.",
  coverImageUrl: null,
  backgroundImageUrl: null,
  releaseDate: "2026-01-01",
  genres: ["Action"],
  platforms: ["PC"],
  externalRating: 8,
  estimatedPlaytime: 12,
  screenshots: [],
  metadata: {},
}));

describe("PopularNowCarousel", () => {
  const animationFrames: FrameRequestCallback[] = [];

  beforeEach(() => {
    animationFrames.length = 0;
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("auto-scrolls the popular rail without user input", () => {
    render(<PopularNowCarousel games={games} />);

    const rail = screen.getByTestId("popular-carousel-rail") as HTMLDivElement;
    Object.defineProperty(rail, "scrollWidth", {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(rail, "clientWidth", {
      configurable: true,
      value: 800,
    });
    rail.scrollLeft = 0;

    act(() => {
      animationFrames[0]?.(0);
    });
    act(() => {
      animationFrames[1]?.(1000);
    });

    expect(rail.scrollLeft).toBeGreaterThan(0);
  });
});
