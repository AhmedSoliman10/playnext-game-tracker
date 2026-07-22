import { z } from "zod";
import { GAME_STATUSES } from "@/lib/types";

export const searchParamsSchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  genre: z.string().trim().max(80).optional().default(""),
  platform: z.string().trim().max(80).optional().default(""),
  year: z.coerce.number().int().min(1970).max(2035).optional(),
  status: z.enum(GAME_STATUSES).optional(),
  minRating: z.coerce.number().min(1).max(10).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(25),
  sort: z
    .enum(["relevance", "release-date", "external-rating", "user-rating"])
    .optional()
    .default("relevance"),
});

export type GameSearchParams = z.infer<typeof searchParamsSchema>;
