import { z } from "zod";

export const recommendationFeedbackSchema = z.object({
  gameSlug: z.string().min(1).max(160),
  action: z.enum([
    "hide_game",
    "show_less",
    "show_more",
    "prefer_shorter",
    "prefer_platform",
  ]),
  platform: z.string().trim().max(80).nullable().optional(),
});

export type RecommendationFeedbackInput = z.infer<
  typeof recommendationFeedbackSchema
>;
