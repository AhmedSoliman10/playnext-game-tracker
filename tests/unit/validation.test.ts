import { describe, expect, it } from "vitest";
import { ratingFormSchema } from "@/lib/validation/rating";
import { canTransitionStatus } from "@/lib/validation/status";

describe("rating validation", () => {
  it("allows half-point overall ratings", () => {
    const result = ratingFormSchema.safeParse({
      gameSlug: "hades",
      overallRating: 8.5,
      storyRating: 9,
    });

    expect(result.success).toBe(true);
  });

  it("rejects non-half-step overall ratings", () => {
    const result = ratingFormSchema.safeParse({
      gameSlug: "hades",
      overallRating: 8.3,
    });

    expect(result.success).toBe(false);
  });

  it("allows a skipped optional review", () => {
    const result = ratingFormSchema.safeParse({
      gameSlug: "hades",
      overallRating: 8.5,
      review: null,
    });

    expect(result.success).toBe(true);
    expect(result.data?.review).toBeNull();
  });

  it("normalizes a blank optional review to null", () => {
    const result = ratingFormSchema.safeParse({
      gameSlug: "hades",
      overallRating: 8.5,
      review: "   ",
    });

    expect(result.success).toBe(true);
    expect(result.data?.review).toBeNull();
  });
});

describe("status transitions", () => {
  it("allows changing a game status later", () => {
    expect(canTransitionStatus("played", "want_to_play")).toBe(true);
    expect(canTransitionStatus("not_interested", "playing")).toBe(true);
    expect(canTransitionStatus(null, "skipped")).toBe(true);
  });
});
