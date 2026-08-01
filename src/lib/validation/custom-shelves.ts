import { z } from "zod";

export const customShelfSchema = z.object({
  title: z.string().trim().min(2, "Name the shelf first.").max(80),
  description: z.string().trim().max(240).nullable().optional(),
  isPublic: z.boolean().optional().default(true),
});

export const shelfGameSchema = z.object({
  shelfId: z.string().uuid(),
  gameSlug: z.string().min(1).max(160),
});

export type CustomShelfInput = z.infer<typeof customShelfSchema>;
export type ShelfGameInput = z.infer<typeof shelfGameSchema>;
