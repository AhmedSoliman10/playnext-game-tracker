import { z } from "zod";
import { GAME_STATUSES } from "@/lib/types";

export const gameStatusSchema = z.enum(GAME_STATUSES);

export const statusUpdateSchema = z.object({
  gameSlug: z.string().min(1).max(160),
  status: gameStatusSchema,
  isFavorite: z.boolean().optional(),
  finished: z.boolean().nullable().optional(),
});

export const favoriteUpdateSchema = z.object({
  gameSlug: z.string().min(1).max(160),
  isFavorite: z.boolean(),
});

export const removeUserGameSchema = z.object({
  gameSlug: z.string().min(1).max(160),
});

export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
export type FavoriteUpdateInput = z.infer<typeof favoriteUpdateSchema>;
export type RemoveUserGameInput = z.infer<typeof removeUserGameSchema>;

const allowedTransitions: Record<
  z.infer<typeof gameStatusSchema>,
  z.infer<typeof gameStatusSchema>[]
> = {
  played: [...GAME_STATUSES],
  playing: [...GAME_STATUSES],
  want_to_play: [...GAME_STATUSES],
  dropped: [...GAME_STATUSES],
  not_interested: [...GAME_STATUSES],
  skipped: [
    "played",
    "playing",
    "want_to_play",
    "dropped",
    "not_interested",
    "skipped",
  ],
};

export function canTransitionStatus(
  from: z.infer<typeof gameStatusSchema> | null | undefined,
  to: z.infer<typeof gameStatusSchema>,
) {
  if (!from) {
    return true;
  }

  return allowedTransitions[from].includes(to);
}
