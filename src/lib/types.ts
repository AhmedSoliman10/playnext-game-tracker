export const GAME_STATUSES = [
  "played",
  "playing",
  "want_to_play",
  "dropped",
  "not_interested",
  "skipped",
] as const;

export type GameStatus = (typeof GAME_STATUSES)[number];

export const DISCOVERY_ACTIONS = [
  ...GAME_STATUSES,
  "favorite",
  "unfavorite",
] as const;

export type DiscoveryAction = (typeof DISCOVERY_ACTIONS)[number];

export const STATUS_LABELS: Record<GameStatus, string> = {
  played: "Played",
  playing: "Currently playing",
  want_to_play: "Want to play",
  dropped: "Dropped",
  not_interested: "Not interested",
  skipped: "Skipped",
};

export const STATUS_PROMPTS: Record<GameStatus, string> = {
  played: "Yes, I played it",
  playing: "I am currently playing it",
  want_to_play: "I want to play it",
  dropped: "I started it but dropped it",
  not_interested: "I am not interested",
  skipped: "Skip for now",
};

export type LibraryFilter =
  | "all"
  | "played"
  | "playing"
  | "want_to_play"
  | "dropped"
  | "favorites"
  | "unrated";

export interface Rating {
  gameId: string;
  overallRating: number;
  storyRating?: number | null;
  gameplayRating?: number | null;
  visualsRating?: number | null;
  soundtrackRating?: number | null;
  difficultyRating?: number | null;
  wouldRecommend?: boolean | null;
  review?: string | null;
  finished?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserGame {
  gameId: string;
  status: GameStatus;
  isFavorite: boolean;
  finished?: boolean | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryEntry {
  game: import("@/lib/games/types").GameSummary;
  userGame: UserGame;
  rating?: Rating | null;
}

export interface UserContext {
  userId: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  isDemo: boolean;
}

export interface PublicProfile {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isCurrentUser: boolean;
  isPrivate?: boolean;
}

export interface PublicActivityItem {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatarUrl?: string | null;
  gameSlug: string;
  gameTitle: string;
  gameCoverImageUrl?: string | null;
  activityType: "status_changed" | "rating_saved" | "favorite_changed";
  status?: GameStatus | null;
  overallRating?: number | null;
  isFavorite?: boolean | null;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  gameId: string;
  gameTitle: string;
  activityType: "status_changed" | "rating_saved" | "favorite_changed";
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
}
