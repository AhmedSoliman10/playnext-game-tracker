import { z } from "zod";

export const activityReactionSchema = z.object({
  activityId: z.string().uuid(),
});

export const activityCommentSchema = z.object({
  activityId: z.string().uuid(),
  body: z.string().trim().min(1, "Write a comment first.").max(400),
});

export const reportSchema = z.object({
  reportType: z.enum(["profile", "review", "activity", "comment", "game"]),
  reportedUserId: z.string().uuid().nullable().optional(),
  gameSlug: z.string().min(1).max(160).nullable().optional(),
  activityId: z.string().uuid().nullable().optional(),
  ratingId: z.string().uuid().nullable().optional(),
  commentId: z.string().uuid().nullable().optional(),
  reason: z
    .string()
    .trim()
    .min(8, "Tell us a little more so the report is useful.")
    .max(800),
});

export const blockUserSchema = z.object({
  blockedUserId: z.string().uuid(),
});

export type ActivityReactionInput = z.infer<typeof activityReactionSchema>;
export type ActivityCommentInput = z.infer<typeof activityCommentSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type BlockUserInput = z.infer<typeof blockUserSchema>;
