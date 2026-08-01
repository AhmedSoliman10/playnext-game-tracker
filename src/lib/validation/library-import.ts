import { z } from "zod";
import { GAME_STATUSES } from "@/lib/types";

export const libraryImportSchema = z.object({
  csv: z.string().min(1, "Choose a CSV file first.").max(500_000),
});

export const steamLibraryImportSchema = z.object({
  profile: z
    .string()
    .trim()
    .min(2, "Paste a Steam profile URL, custom ID, or SteamID64.")
    .max(160),
});

export const libraryImportRowSchema = z.object({
  slug: z.string().trim().min(1),
  status: z.enum(GAME_STATUSES),
  isFavorite: z.boolean().optional().default(false),
  overallRating: z.number().min(1).max(10).nullable().optional(),
  review: z.string().trim().max(800).nullable().optional(),
});

export type LibraryImportInput = z.infer<typeof libraryImportSchema>;
export type SteamLibraryImportInput = z.infer<typeof steamLibraryImportSchema>;
export type LibraryImportRow = z.infer<typeof libraryImportRowSchema>;
