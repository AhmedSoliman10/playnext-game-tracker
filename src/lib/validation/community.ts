import { z } from "zod";

export const followSchema = z.object({
  followingId: z.uuid("Choose a valid player."),
});

export type FollowInput = z.infer<typeof followSchema>;
