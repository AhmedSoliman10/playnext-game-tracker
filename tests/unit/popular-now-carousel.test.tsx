import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a duplicated CSS marquee track for automatic scrolling", () => {
    render(<PopularNowCarousel games={games} />);

    const track = screen.getByTestId(
      "popular-carousel-track",
    ) as HTMLDivElement;
    const firstGroup = screen.getByTestId(
      "popular-carousel-primary-group",
    ) as HTMLDivElement;

    expect(track).toHaveClass("popular-carousel-track");
    expect(firstGroup.children).toHaveLength(games.length);
    expect(track.querySelectorAll("[aria-hidden='true']")).not.toHaveLength(0);
  });

  it("keeps arrow buttons useful through native rail scrolling", async () => {
    render(<PopularNowCarousel games={games} />);

    const rail = screen.getByTestId("popular-carousel-rail") as HTMLDivElement;
    const scrollBy = vi.fn();
    Object.defineProperty(rail, "scrollBy", {
      configurable: true,
      value: scrollBy,
    });
    Object.defineProperty(rail, "clientWidth", {
      configurable: true,
      value: 800,
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Next popular game" }),
    );

    expect(scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth" }),
    );
  });
});
