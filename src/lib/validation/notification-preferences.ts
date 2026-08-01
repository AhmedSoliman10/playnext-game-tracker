import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  inAppFollowedYou: z.boolean(),
  inAppReaction: z.boolean(),
  inAppComment: z.boolean(),
  inAppSystem: z.boolean(),
  emailDigestEnabled: z.boolean(),
  quietModeEnabled: z.boolean(),
});

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
