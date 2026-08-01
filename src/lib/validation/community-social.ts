import { z } from "zod";

export const activityReactionSchema = z.object({
  activityId: z.string().uuid(),
});

export const activityCommentSchema = z.object({
  activityId: z.string().uuid(),
  body: z.string().trim().min(1, "Write a comment first.").max(400),
});

export const reportSchema = z.object({
  reportType: z.enum([
    "profile",
    "review",
    "activity",
    "comment",
    "post",
    "game",
  ]),
  reportedUserId: z.string().uuid().nullable().optional(),
  gameSlug: z.string().min(1).max(160).nullable().optional(),
  activityId: z.string().uuid().nullable().optional(),
  ratingId: z.string().uuid().nullable().optional(),
  commentId: z.string().uuid().nullable().optional(),
  postId: z.string().uuid().nullable().optional(),
  postCommentId: z.string().uuid().nullable().optional(),
  reason: z
    .string()
    .trim()
    .min(8, "Tell us a little more so the report is useful.")
    .max(800),
});

export const blockUserSchema = z.object({
  blockedUserId: z.string().uuid(),
});

export const communityPostVisibilitySchema = z.enum(["public", "followers"]);

export const communityPostMoodSchema = z.enum([
  "discussion",
  "playing",
  "completed",
  "backlog",
  "recommendation",
]);

export const communityPostReactionSchema = z.enum([
  "like",
  "hype",
  "played_it",
  "backlog",
]);

const optionalHttpsUrlSchema = z
  .string()
  .trim()
  .url("Use a valid https image URL.")
  .refine((value) => value.startsWith("https://"), {
    message: "Image URLs must use https.",
  })
  .max(1000)
  .optional()
  .nullable()
  .transform((value) => (value?.trim() ? value.trim() : null));

export const communityPostCreateSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write something first.")
    .max(1200, "Keep posts under 1,200 characters."),
  visibility: communityPostVisibilitySchema.default("public"),
  mood: communityPostMoodSchema.default("discussion"),
  gameSlug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .optional()
    .nullable()
    .transform((value) => (value?.trim() ? value.trim() : null)),
  imageUrl: optionalHttpsUrlSchema,
});

export const communityPostReactionInputSchema = z.object({
  postId: z.string().uuid(),
  reaction: communityPostReactionSchema,
});

export const communityPostCommentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1, "Write a comment first.").max(500),
});

export const communityPostBookmarkSchema = z.object({
  postId: z.string().uuid(),
});

export const communityPostDeleteSchema = z.object({
  postId: z.string().uuid(),
});

export type ActivityReactionInput = z.infer<typeof activityReactionSchema>;
export type ActivityCommentInput = z.infer<typeof activityCommentSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type BlockUserInput = z.infer<typeof blockUserSchema>;
export type CommunityPostCreateInput = z.infer<
  typeof communityPostCreateSchema
>;
export type CommunityPostReactionInput = z.infer<
  typeof communityPostReactionInputSchema
>;
export type CommunityPostCommentInput = z.infer<
  typeof communityPostCommentSchema
>;
export type CommunityPostBookmarkInput = z.infer<
  typeof communityPostBookmarkSchema
>;
export type CommunityPostDeleteInput = z.infer<
  typeof communityPostDeleteSchema
>;
