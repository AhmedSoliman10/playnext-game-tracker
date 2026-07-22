import { z } from "zod";

const wholeRatingSchema = z
  .number({ error: "Choose a value from 1 to 10." })
  .int("Use a whole number from 1 to 10.")
  .min(1, "Use a value from 1 to 10.")
  .max(10, "Use a value from 1 to 10.");

export const ratingFormSchema = z.object({
  gameSlug: z.string().min(1),
  finished: z.boolean().nullable().optional(),
  overallRating: z
    .number({ error: "Choose an overall rating." })
    .min(1, "Use a value from 1 to 10.")
    .max(10, "Use a value from 1 to 10.")
    .refine((value) => Number.isInteger(value * 2), {
      message: "Overall rating can use half-point steps only.",
    }),
  storyRating: wholeRatingSchema.nullable().optional(),
  gameplayRating: wholeRatingSchema.nullable().optional(),
  visualsRating: wholeRatingSchema.nullable().optional(),
  soundtrackRating: wholeRatingSchema.nullable().optional(),
  difficultyRating: wholeRatingSchema.nullable().optional(),
  wouldRecommend: z.boolean().nullable().optional(),
  review: z
    .union([
      z.string().trim().max(800, "Keep the review under 800 characters."),
      z.null(),
    ])
    .optional()
    .transform((value) =>
      typeof value === "string" && value.trim() ? value.trim() : null,
    ),
});

export type RatingFormInput = z.input<typeof ratingFormSchema>;
export type RatingFormValues = z.output<typeof ratingFormSchema>;
