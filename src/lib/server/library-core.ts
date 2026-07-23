import type { GameSummary } from "@/lib/games/types";
import type { ActivityItem, LibraryEntry, Rating, UserGame } from "@/lib/types";
import type { RatingFormValues } from "@/lib/validation/rating";
import type {
  FavoriteUpdateInput,
  RemoveUserGameInput,
  StatusUpdateInput,
} from "@/lib/validation/status";
import { canTransitionStatus } from "@/lib/validation/status";

export interface LibraryState {
  userGames: Record<string, UserGame>;
  ratings: Record<string, Rating>;
  discoveryInteractions: Record<string, string>;
  activities: ActivityItem[];
}

export function createEmptyLibraryState(): LibraryState {
  return {
    userGames: {},
    ratings: {},
    discoveryInteractions: {},
    activities: [],
  };
}

function nowIso() {
  return new Date().toISOString();
}

function id() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function activity(
  game: GameSummary,
  type: ActivityItem["activityType"],
  metadata: ActivityItem["metadata"],
): ActivityItem {
  return {
    id: id(),
    gameId: game.id,
    gameTitle: game.title,
    activityType: type,
    metadata,
    createdAt: nowIso(),
  };
}

export function applyStatusUpdate(
  state: LibraryState,
  game: GameSummary,
  input: StatusUpdateInput,
) {
  const existing = state.userGames[input.gameSlug];
  if (!canTransitionStatus(existing?.status, input.status)) {
    throw new Error("That status change is not available.");
  }

  const timestamp = nowIso();
  state.discoveryInteractions[input.gameSlug] = input.status;

  if (input.status === "skipped") {
    delete state.userGames[input.gameSlug];
    state.activities.unshift(
      activity(game, "status_changed", {
        status: input.status,
        gameSlug: input.gameSlug,
      }),
    );
    return null;
  }

  const statusStartedAt =
    input.status === "playing" && !existing?.startedAt
      ? timestamp
      : (existing?.startedAt ?? null);
  const statusCompletedAt =
    input.status === "played" && input.finished
      ? timestamp
      : (existing?.completedAt ?? null);

  const next: UserGame = {
    gameId: game.id,
    status: input.status,
    isFavorite: input.isFavorite ?? existing?.isFavorite ?? false,
    finished:
      input.finished ??
      (input.status === "played"
        ? (existing?.finished ?? null)
        : (existing?.finished ?? null)),
    startedAt: statusStartedAt,
    completedAt: statusCompletedAt,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  state.userGames[input.gameSlug] = next;
  state.activities.unshift(
    activity(game, "status_changed", {
      status: input.status,
      isFavorite: next.isFavorite,
      gameSlug: input.gameSlug,
    }),
  );

  return next;
}

export function applyFavoriteUpdate(
  state: LibraryState,
  game: GameSummary,
  input: FavoriteUpdateInput,
) {
  const existing = state.userGames[input.gameSlug];
  const timestamp = nowIso();
  const next: UserGame = {
    gameId: game.id,
    status: existing?.status ?? "want_to_play",
    isFavorite: input.isFavorite,
    finished: existing?.finished ?? null,
    startedAt: existing?.startedAt ?? null,
    completedAt: existing?.completedAt ?? null,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  state.userGames[input.gameSlug] = next;
  state.activities.unshift(
    activity(game, "favorite_changed", {
      isFavorite: input.isFavorite,
    }),
  );

  return next;
}

export function applyRatingSave(
  state: LibraryState,
  game: GameSummary,
  values: RatingFormValues,
) {
  const existingRating = state.ratings[values.gameSlug];
  const timestamp = nowIso();

  const rating: Rating = {
    gameId: game.id,
    overallRating: values.overallRating,
    storyRating: values.storyRating ?? null,
    gameplayRating: values.gameplayRating ?? null,
    visualsRating: values.visualsRating ?? null,
    soundtrackRating: values.soundtrackRating ?? null,
    difficultyRating: values.difficultyRating ?? null,
    wouldRecommend: values.wouldRecommend ?? null,
    review: values.review ?? null,
    finished: values.finished ?? null,
    createdAt: existingRating?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  state.ratings[values.gameSlug] = rating;
  applyStatusUpdate(state, game, {
    gameSlug: values.gameSlug,
    status: "played",
    finished: values.finished,
  });
  state.activities.unshift(
    activity(game, "rating_saved", {
      overallRating: values.overallRating,
      wouldRecommend: values.wouldRecommend ?? null,
    }),
  );

  return rating;
}

export function applyLibraryRemoval(
  state: LibraryState,
  input: RemoveUserGameInput,
) {
  const existed = Boolean(
    state.userGames[input.gameSlug] || state.ratings[input.gameSlug],
  );
  delete state.userGames[input.gameSlug];
  delete state.ratings[input.gameSlug];
  return existed;
}

export function toLibraryEntries(
  state: LibraryState,
  gamesBySlug: Map<string, GameSummary>,
): LibraryEntry[] {
  const entries: Array<LibraryEntry | null> = Object.entries(state.userGames)
    .filter(([, userGame]) => userGame.status !== "skipped")
    .map(([slug, userGame]) => {
      const game = gamesBySlug.get(slug);
      if (!game) {
        return null;
      }

      return {
        game,
        userGame,
        rating: state.ratings[slug] ?? null,
      };
    });

  return entries
    .filter((entry): entry is LibraryEntry => Boolean(entry))
    .sort(
      (a, b) =>
        new Date(b.userGame.updatedAt).getTime() -
        new Date(a.userGame.updatedAt).getTime(),
    );
}
