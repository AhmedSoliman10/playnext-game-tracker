import { isSupabaseConfigured } from "@/lib/auth/env";
import type { GameSummary } from "@/lib/games/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
import type {
  LibraryEntry,
  PublicProfile,
  Rating,
  UserContext,
  UserGame,
} from "@/lib/types";
import type { FollowInput } from "@/lib/validation/community";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PublicProfileRow = Pick<
  ProfileRow,
  "id" | "display_name" | "avatar_url" | "created_at" | "is_private"
>;
type GameRow = Database["public"]["Tables"]["games"]["Row"];
type UserGameRow = Database["public"]["Tables"]["user_games"]["Row"];
type RatingRow = Database["public"]["Tables"]["ratings"]["Row"];

export interface PublicProfileDetails {
  profile: PublicProfile;
  entries: LibraryEntry[];
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
    createdAt: profile.created_at,
    followersCount: followerCounts.get(profile.id) ?? 0,
    followingCount: followingCounts.get(profile.id) ?? 0,
    isFollowing: viewerFollows.has(profile.id),
    isCurrentUser: profile.id === user.userId,
    isPrivate: profile.is_private,
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
      },
    ];
  }

  const supabase = await createSupabaseServerClient();
  let profiles: PublicProfileRow[] = [];
  const { data: profilesWithPrivacy, error: profilesError } = await supabase!
    .from("profiles")
    .select("id, display_name, avatar_url, created_at, is_private")
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

    profiles = (fallbackProfiles ?? []).map((profile) => ({
      ...profile,
      is_private: false,
    }));
  } else {
    profiles = profilesWithPrivacy ?? [];
  }

  const { followerCounts, followingCounts, viewerFollows } =
    await getFollowState(user);

  return profiles
    .filter((profile) => !profile.is_private || profile.id === user.userId)
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

  if (!profile || (profile.is_private && profile.id !== user.userId)) {
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
    .limit(80);

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
