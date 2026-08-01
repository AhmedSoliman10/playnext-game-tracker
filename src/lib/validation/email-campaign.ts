import { z } from "zod";

export const emailCampaignRequestSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(500).optional(),
});

export type EmailCampaignRequest = z.infer<typeof emailCampaignRequestSchema>;
