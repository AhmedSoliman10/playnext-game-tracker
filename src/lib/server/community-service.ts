import { isSupabaseConfigured } from "@/lib/auth/env";
import { mapDiscordProfileRow } from "@/lib/auth/discord-profile";
import type { GameSummary } from "@/lib/games/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createFollowNotification } from "@/lib/server/notification-service";
import type { Database, Json } from "@/lib/supabase/database.types";
import { GAME_STATUSES } from "@/lib/types";
import type {
  LibraryEntry,
  PublicActivityItem,
  PublicProfile,
  Rating,
  GameStatus,
  UserContext,
  UserGame,
} from "@/lib/types";
import type { FollowInput } from "@/lib/validation/community";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PublicProfileRow = Pick<
  ProfileRow,
  | "id"
  | "display_name"
  | "avatar_url"
  | "created_at"
  | "is_private"
  | "discord_user_id"
  | "discord_username"
  | "discord_avatar_url"
  | "discord_connected_at"
>;
type GameRow = Database["public"]["Tables"]["games"]["Row"];
type UserGameRow = Database["public"]["Tables"]["user_games"]["Row"];
type RatingRow = Database["public"]["Tables"]["ratings"]["Row"];
type ActivityRow = Database["public"]["Tables"]["activity_log"]["Row"];
type ActivityCommentRow =
  Database["public"]["Tables"]["activity_comments"]["Row"];

export interface PublicProfileDetails {
  profile: PublicProfile;
  entries: LibraryEntry[];
}

function isMissingSocialTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "42703";
}

function withMissingProfileColumns(
  profile: Pick<
    ProfileRow,
    "id" | "display_name" | "avatar_url" | "created_at"
  >,
): PublicProfileRow {
  return {
    ...profile,
    is_private: false,
    discord_user_id: null,
    discord_username: null,
    discord_avatar_url: null,
    discord_connected_at: null,
  };
}

function jsonArray(value: Json | undefined, key: string): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const candidate = value[key];
  return Array.isArray(candidate)
    ? candidate.filter((item): item is string => typeof item === "string")
    : [];
}

function mapGameRow(row: GameRow): GameSummary {
  return {
    id: row.provider_game_id,
    provider: row.provider === "igdb" ? "igdb" : "seed",
    providerGameId: row.provider_game_id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "No description is available yet.",
    coverImageUrl: row.cover_image_url,
    backgroundImageUrl: row.background_image_url,
    releaseDate: row.release_date,
    genres: jsonArray(row.metadata, "genres"),
    platforms: jsonArray(row.metadata, "platforms"),
    developer: row.developer,
    publisher: row.publisher,
    externalRating: row.external_rating,
    estimatedPlaytime: row.estimated_playtime,
    screenshots: jsonArray(row.metadata, "screenshots"),
    metadata: {
      provider: row.provider,
      sourceSlug: row.slug,
    },
  };
}

function mapUserGame(row: UserGameRow, providerGameId: string): UserGame {
  return {
    gameId: providerGameId,
    status: row.status,
    isFavorite: row.is_favorite,
    finished: row.finished,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRating(row: RatingRow, providerGameId: string): Rating {
  return {
    gameId: providerGameId,
    overallRating: row.overall_rating,
    storyRating: row.story_rating,
    gameplayRating: row.gameplay_rating,
    visualsRating: row.visuals_rating,
    soundtrackRating: row.soundtrack_rating,
    difficultyRating: row.difficulty_rating,
    wouldRecommend: row.would_recommend,
    review: row.review,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPublicProfile(
  profile: PublicProfileRow,
  user: UserContext,
  followerCounts: Map<string, number>,
  followingCounts: Map<string, number>,
  viewerFollows: Set<string>,
): PublicProfile {
  return {
    id: profile.id,
    displayName: profile.display_name ?? "Player",
    avatarUrl: profile.avatar_url,
    discord: mapDiscordProfileRow(profile),
    createdAt: profile.created_at,
    followersCount: followerCounts.get(profile.id) ?? 0,
    followingCount: followingCounts.get(profile.id) ?? 0,
    isFollowing: viewerFollows.has(profile.id),
    isCurrentUser: profile.id === user.userId,
    isPrivate: profile.is_private,
  };
}

function metadataObject(value: Json): Record<string, Json | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

function metadataNumber(value: Json | undefined) {
  return typeof value === "number" ? value : null;
}

function metadataBoolean(value: Json | undefined) {
  return typeof value === "boolean" ? value : null;
}

function metadataString(value: Json | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isGameStatus(value: string): value is GameStatus {
  return GAME_STATUSES.includes(value as GameStatus);
}

function metadataStatus(value: Json | undefined): GameStatus | null {
  return typeof value === "string" && isGameStatus(value) ? value : null;
}

function mapPublicActivity(
  row: ActivityRow,
  profile: PublicProfileRow,
  game: GameRow,
  rating?: RatingRow,
  reactionCount = 0,
  viewerReacted = false,
  comments: PublicActivityItem["comments"] = [],
): PublicActivityItem {
  const metadata = metadataObject(row.metadata);

  return {
    id: row.id,
    playerId: row.user_id,
    playerName: profile.display_name ?? "Player",
    playerAvatarUrl: profile.avatar_url,
    gameSlug: game.slug,
    gameTitle: game.title,
    gameCoverImageUrl: game.cover_image_url,
    activityType: row.activity_type,
    status: metadataStatus(metadata.status),
    overallRating:
      rating?.overall_rating ?? metadataNumber(metadata.overallRating),
    storyRating: rating?.story_rating ?? metadataNumber(metadata.storyRating),
    gameplayRating:
      rating?.gameplay_rating ?? metadataNumber(metadata.gameplayRating),
    visualsRating:
      rating?.visuals_rating ?? metadataNumber(metadata.visualsRating),
    soundtrackRating:
      rating?.soundtrack_rating ?? metadataNumber(metadata.soundtrackRating),
    difficultyRating:
      rating?.difficulty_rating ?? metadataNumber(metadata.difficultyRating),
    wouldRecommend:
      rating?.would_recommend ?? metadataBoolean(metadata.wouldRecommend),
    review: rating?.review ?? metadataString(metadata.review),
    isFavorite: metadataBoolean(metadata.isFavorite),
    reactionCount,
    viewerReacted,
    comments,
    createdAt: row.created_at,
  };
}

function mapPublicActivityComment(
  row: ActivityCommentRow,
  profile: PublicProfileRow,
): PublicActivityItem["comments"][number] {
  return {
    id: row.id,
    playerId: row.user_id,
    playerName: profile.display_name ?? "Player",
    playerAvatarUrl: profile.avatar_url,
    body: row.body,
    createdAt: row.created_at,
  };
}

async function getFollowState(user: UserContext) {
  const supabase = await createSupabaseServerClient();
  const { data: follows, error } = await supabase!
    .from("follows")
    .select("follower_id, following_id");

  if (error) {
    throw new Error("Could not load follows.");
  }

  const followerCounts = new Map<string, number>();
  const followingCounts = new Map<string, number>();
  const viewerFollows = new Set<string>();

  for (const follow of follows ?? []) {
    followerCounts.set(
      follow.following_id,
      (followerCounts.get(follow.following_id) ?? 0) + 1,
    );
    followingCounts.set(
      follow.follower_id,
      (followingCounts.get(follow.follower_id) ?? 0) + 1,
    );

    if (follow.follower_id === user.userId) {
      viewerFollows.add(follow.following_id);
    }
  }

  return { followerCounts, followingCounts, viewerFollows };
}

async function getBlockedProfileIds(
  user: UserContext,
  candidateIds?: string[],
) {
  const admin = createSupabaseAdminClient();
  const blockedIds = new Set<string>();
  if (!admin || user.isDemo || !isSupabaseConfigured()) {
    return blockedIds;
  }

  const query = admin
    .from("user_blocks")
    .select("blocker_user_id, blocked_user_id")
    .or(`blocker_user_id.eq.${user.userId},blocked_user_id.eq.${user.userId}`);

  const { data, error } = candidateIds?.length
    ? await query.or(
        `blocker_user_id.in.(${candidateIds.join(",")}),blocked_user_id.in.(${candidateIds.join(",")})`,
      )
    : await query;

  if (isMissingSocialTable(error)) {
    return blockedIds;
  }

  if (error) {
    throw new Error("Could not load blocked players.");
  }

  for (const block of data ?? []) {
    if (block.blocker_user_id === user.userId) {
      blockedIds.add(block.blocked_user_id);
    }
    if (block.blocked_user_id === user.userId) {
      blockedIds.add(block.blocker_user_id);
    }
  }

  return blockedIds;
}

export async function getCommunityProfiles(
  user: UserContext,
): Promise<PublicProfile[]> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return [
      {
        id: user.userId,
        displayName: user.displayName ?? "Demo player",
        avatarUrl: user.avatarUrl ?? null,
        createdAt: new Date().toISOString(),
        followersCount: 0,
        followingCount: 0,
        isFollowing: false,
        isCurrentUser: true,
        isPrivate: false,
        discord: user.discord ?? null,
      },
    ];
  }

  const supabase = await createSupabaseServerClient();
  let profiles: PublicProfileRow[] = [];
  const { data: profilesWithPrivacy, error: profilesError } = await supabase!
    .from("profiles")
    .select(
      "id, display_name, avatar_url, created_at, is_private, discord_user_id, discord_username, discord_avatar_url, discord_connected_at",
    )
    .order("created_at", { ascending: false })
    .limit(48);

  if (profilesError) {
    if (profilesError.code !== "42703") {
      throw new Error("Could not load community profiles.");
    }

    const { data: fallbackProfiles, error: fallbackError } = await supabase!
      .from("profiles")
      .select("id, display_name, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(48);

    if (fallbackError) {
      throw new Error("Could not load community profiles.");
    }

    profiles = (fallbackProfiles ?? []).map(withMissingProfileColumns);
  } else {
    profiles = profilesWithPrivacy ?? [];
  }

  const { followerCounts, followingCounts, viewerFollows } =
    await getFollowState(user);
  const blockedProfileIds = await getBlockedProfileIds(
    user,
    profiles.map((profile) => profile.id),
  );

  return profiles
    .filter(
      (profile) =>
        (!profile.is_private || profile.id === user.userId) &&
        !blockedProfileIds.has(profile.id),
    )
    .map((profile) =>
      mapPublicProfile(
        profile,
        user,
        followerCounts,
        followingCounts,
        viewerFollows,
      ),
    );
}

export async function getCommunityActivityFeed(
  user: UserContext,
  limit = 20,
): Promise<PublicActivityItem[]> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return [];
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return [];
  }

  let profiles: PublicProfileRow[] = [];
  const { data: profilesWithPrivacy, error: profilesError } = await admin
    .from("profiles")
    .select(
      "id, display_name, avatar_url, created_at, is_private, discord_user_id, discord_username, discord_avatar_url, discord_connected_at",
    );

  if (profilesError) {
    if (profilesError.code !== "42703") {
      throw new Error("Could not load public activity profiles.");
    }

    const { data: fallbackProfiles, error: fallbackError } = await admin
      .from("profiles")
      .select("id, display_name, avatar_url, created_at");

    if (fallbackError) {
      throw new Error("Could not load public activity profiles.");
    }

    profiles = (fallbackProfiles ?? []).map(withMissingProfileColumns);
  } else {
    profiles = profilesWithPrivacy ?? [];
  }

  const blockedProfileIds = await getBlockedProfileIds(
    user,
    profiles.map((profile) => profile.id),
  );
  const visibleProfiles = profiles.filter(
    (profile) =>
      (!profile.is_private || profile.id === user.userId) &&
      !blockedProfileIds.has(profile.id),
  );
  const profileIds = visibleProfiles.map((profile) => profile.id);
  if (!profileIds.length) {
    return [];
  }

  const { data: activities, error: activityError } = await admin
    .from("activity_log")
    .select("*")
    .in("user_id", profileIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (activityError) {
    throw new Error("Could not load public activity.");
  }

  const rows = activities ?? [];
  const gameIds = [...new Set(rows.map((row) => row.game_id))];
  if (!gameIds.length) {
    return [];
  }

  const { data: games, error: gamesError } = await admin
    .from("games")
    .select("*")
    .in("id", gameIds);

  if (gamesError) {
    throw new Error("Could not load activity games.");
  }

  const profilesById = new Map(
    visibleProfiles.map((profile) => [profile.id, profile]),
  );
  const gamesById = new Map((games ?? []).map((game) => [game.id, game]));
  const { data: ratings, error: ratingsError } = await admin
    .from("ratings")
    .select("*")
    .in("game_id", gameIds)
    .in("user_id", profileIds);

  if (ratingsError) {
    throw new Error("Could not load public rating details.");
  }

  const ratingsByUserAndGameId = new Map(
    (ratings ?? []).map((rating) => [
      `${rating.user_id}:${rating.game_id}`,
      rating,
    ]),
  );
  const activityIds = rows.map((row) => row.id);
  const reactionCounts = new Map<string, number>();
  const viewerReactionIds = new Set<string>();
  const commentsByActivityId = new Map<
    string,
    PublicActivityItem["comments"]
  >();

  const { data: reactions, error: reactionsError } = await admin
    .from("activity_reactions")
    .select("activity_id, user_id")
    .in("activity_id", activityIds);

  if (!isMissingSocialTable(reactionsError)) {
    if (reactionsError) {
      throw new Error("Could not load activity reactions.");
    }

    for (const reaction of reactions ?? []) {
      reactionCounts.set(
        reaction.activity_id,
        (reactionCounts.get(reaction.activity_id) ?? 0) + 1,
      );
      if (reaction.user_id === user.userId) {
        viewerReactionIds.add(reaction.activity_id);
      }
    }
  }

  const { data: comments, error: commentsError } = await admin
    .from("activity_comments")
    .select("*")
    .in("activity_id", activityIds)
    .order("created_at", { ascending: true })
    .limit(Math.max(limit * 3, 12));

  if (!isMissingSocialTable(commentsError)) {
    if (commentsError) {
      throw new Error("Could not load activity comments.");
    }

    const commentUserIds = [
      ...new Set((comments ?? []).map((comment) => comment.user_id)),
    ].filter((id) => !profilesById.has(id));
    if (commentUserIds.length) {
      const { data: commentProfiles, error: commentProfilesError } = await admin
        .from("profiles")
        .select(
          "id, display_name, avatar_url, created_at, is_private, discord_user_id, discord_username, discord_avatar_url, discord_connected_at",
        )
        .in("id", commentUserIds);

      if (!commentProfilesError) {
        for (const profile of commentProfiles ?? []) {
          if (!profile.is_private && !blockedProfileIds.has(profile.id)) {
            profilesById.set(profile.id, profile);
          }
        }
      }
    }

    for (const comment of comments ?? []) {
      const profile = profilesById.get(comment.user_id);
      if (!profile) {
        continue;
      }

      const current = commentsByActivityId.get(comment.activity_id) ?? [];
      if (current.length < 3) {
        commentsByActivityId.set(comment.activity_id, [
          ...current,
          mapPublicActivityComment(comment, profile),
        ]);
      }
    }
  }

  return rows
    .map((row) => {
      const profile = profilesById.get(row.user_id);
      const game = gamesById.get(row.game_id);
      const rating = ratingsByUserAndGameId.get(
        `${row.user_id}:${row.game_id}`,
      );

      return profile && game
        ? mapPublicActivity(
            row,
            profile,
            game,
            rating,
            reactionCounts.get(row.id) ?? 0,
            viewerReactionIds.has(row.id),
            commentsByActivityId.get(row.id) ?? [],
          )
        : null;
    })
    .filter((item): item is PublicActivityItem => Boolean(item));
}

export async function getPublicProfileDetails(
  user: UserContext,
  profileId: string,
): Promise<PublicProfileDetails | null> {
  if (user.isDemo || !isSupabaseConfigured()) {
    if (profileId !== user.userId) {
      return null;
    }

    return {
      profile: {
        id: user.userId,
        displayName: user.displayName ?? "Demo player",
        avatarUrl: user.avatarUrl ?? null,
        createdAt: new Date().toISOString(),
        followersCount: 0,
        followingCount: 0,
        isFollowing: false,
        isCurrentUser: true,
        isPrivate: false,
        discord: user.discord ?? null,
      },
      entries: [],
    };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Public profiles need Supabase admin access.");
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    throw new Error("Could not load that profile.");
  }

  const blockedProfileIds = await getBlockedProfileIds(user, [profileId]);
  if (
    !profile ||
    (profile.is_private && profile.id !== user.userId) ||
    blockedProfileIds.has(profile.id)
  ) {
    return null;
  }

  const { followerCounts, followingCounts, viewerFollows } =
    await getFollowState(user);
  const { data: userGames, error: userGamesError } = await admin
    .from("user_games")
    .select("*")
    .eq("user_id", profileId)
    .not("status", "in", "(not_interested,skipped)")
    .order("updated_at", { ascending: false })
    .limit(240);

  if (userGamesError) {
    throw new Error("Could not load public library.");
  }

  const gameIds = [...new Set((userGames ?? []).map((row) => row.game_id))];
  if (!gameIds.length) {
    return {
      profile: mapPublicProfile(
        profile,
        user,
        followerCounts,
        followingCounts,
        viewerFollows,
      ),
      entries: [],
    };
  }

  const [
    { data: games, error: gamesError },
    { data: ratings, error: ratingsError },
  ] = await Promise.all([
    admin.from("games").select("*").in("id", gameIds),
    admin
      .from("ratings")
      .select("*")
      .eq("user_id", profileId)
      .in("game_id", gameIds),
  ]);

  if (gamesError || ratingsError) {
    throw new Error("Could not load public profile games.");
  }

  const gamesById = new Map((games ?? []).map((game) => [game.id, game]));
  const ratingsByGameId = new Map(
    (ratings ?? []).map((rating) => [rating.game_id, rating]),
  );
  const entries: LibraryEntry[] = [];
  for (const userGame of userGames ?? []) {
    const game = gamesById.get(userGame.game_id);
    if (!game) {
      continue;
    }

    const rating = ratingsByGameId.get(userGame.game_id);
    const mappedGame = mapGameRow(game);
    entries.push({
      game: mappedGame,
      userGame: mapUserGame(userGame, mappedGame.providerGameId),
      rating: rating ? mapRating(rating, mappedGame.providerGameId) : null,
    });
  }

  return {
    profile: mapPublicProfile(
      profile,
      user,
      followerCounts,
      followingCounts,
      viewerFollows,
    ),
    entries,
  };
}

export async function followPlayer(user: UserContext, input: FollowInput) {
  if (user.userId === input.followingId) {
    throw new Error("You cannot follow yourself.");
  }

  if (user.isDemo || !isSupabaseConfigured()) {
    throw new Error("Community follows need Supabase authentication.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase!.from("follows").upsert(
    {
      follower_id: user.userId,
      following_id: input.followingId,
    },
    { onConflict: "follower_id,following_id" },
  );

  if (error) {
    throw new Error("Could not follow that player.");
  }

  await createFollowNotification(user, input.followingId);
}

export async function unfollowPlayer(user: UserContext, input: FollowInput) {
  if (user.isDemo || !isSupabaseConfigured()) {
    throw new Error("Community follows need Supabase authentication.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase!
    .from("follows")
    .delete()
    .eq("follower_id", user.userId)
    .eq("following_id", input.followingId);

  if (error) {
    throw new Error("Could not unfollow that player.");
  }
}
