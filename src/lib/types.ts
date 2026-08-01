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
  | "hidden"
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
  discord?: DiscordProfile | null;
  isDemo: boolean;
}

export type NotificationType =
  "followed_you" | "reaction" | "comment" | "system";

export interface DiscordProfile {
  connected: boolean;
  userId?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  connectedAt?: string | null;
}

export interface NotificationPreferences {
  inAppFollowedYou: boolean;
  inAppReaction: boolean;
  inAppComment: boolean;
  inAppSystem: boolean;
  emailDigestEnabled: boolean;
  quietModeEnabled: boolean;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  linkHref?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationCenter {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface GameRatingBreakdown {
  averageRating: number | null;
  totalRatings: number;
  distribution: Array<{ label: string; value: number }>;
}

export interface GameReview {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  isFollowedByViewer?: boolean;
  overallRating: number;
  storyRating?: number | null;
  gameplayRating?: number | null;
  visualsRating?: number | null;
  soundtrackRating?: number | null;
  difficultyRating?: number | null;
  wouldRecommend?: boolean | null;
  review?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameReviewSummary {
  friendAverageRating: number | null;
  friendRatingCount: number;
}

export interface PublicProfile {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  discord?: DiscordProfile | null;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isCurrentUser: boolean;
  isPrivate?: boolean;
  isBlockedByViewer?: boolean;
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
  storyRating?: number | null;
  gameplayRating?: number | null;
  visualsRating?: number | null;
  soundtrackRating?: number | null;
  difficultyRating?: number | null;
  wouldRecommend?: boolean | null;
  review?: string | null;
  isFavorite?: boolean | null;
  reactionCount: number;
  viewerReacted: boolean;
  comments: PublicActivityComment[];
  createdAt: string;
}

export interface PublicActivityComment {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatarUrl?: string | null;
  body: string;
  createdAt: string;
}

export type CommunityPostVisibility = "public" | "followers";

export type CommunityPostMood =
  "discussion" | "playing" | "completed" | "backlog" | "recommendation";

export type CommunityPostReactionType =
  "like" | "hype" | "played_it" | "backlog";

export interface CommunityPostAuthor {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  isCurrentUser: boolean;
  isFollowing: boolean;
}

export interface CommunityPostComment {
  id: string;
  author: CommunityPostAuthor;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPost {
  id: string;
  author: CommunityPostAuthor;
  body: string;
  visibility: CommunityPostVisibility;
  mood: CommunityPostMood;
  imageUrl?: string | null;
  game?: import("@/lib/games/types").GameSummary | null;
  reactionCounts: Record<CommunityPostReactionType, number>;
  reactionTotal: number;
  commentCount: number;
  viewerReaction?: CommunityPostReactionType | null;
  viewerBookmarked: boolean;
  comments: CommunityPostComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityFeedStats {
  postCount: number;
  followingPostCount: number;
  gamePostCount: number;
  playerCount: number;
}

export type RecommendationFeedbackAction =
  | "show_more"
  | "show_less"
  | "hide_game"
  | "prefer_shorter"
  | "prefer_platform";

export interface RecommendationFeedback {
  gameSlug: string;
  action: RecommendationFeedbackAction;
  platform?: string | null;
}

export interface CustomShelf {
  id: string;
  ownerId: string;
  title: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  entries: LibraryEntry[];
}

export interface TasteCompatibility {
  score: number;
  label: string;
  reasons: string[];
}

export interface ActivityItem {
  id: string;
  gameId: string;
  gameTitle: string;
  activityType: "status_changed" | "rating_saved" | "favorite_changed";
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
}
