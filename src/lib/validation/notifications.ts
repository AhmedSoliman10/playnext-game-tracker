import { z } from "zod";

export const notificationReadSchema = z
  .object({
    notificationIds: z.array(z.string().uuid()).max(50).optional(),
    markAll: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.markAll === true ||
      Boolean(value.notificationIds && value.notificationIds.length > 0),
    {
      message: "Choose at least one notification to update.",
    },
  );

export const notificationDeleteSchema = z.object({
  notificationId: z.string().uuid(),
});

export type NotificationReadInput = z.infer<typeof notificationReadSchema>;
export type NotificationDeleteInput = z.infer<typeof notificationDeleteSchema>;
