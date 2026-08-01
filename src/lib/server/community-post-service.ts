import { isSupabaseConfigured } from "@/lib/auth/env";
import {
  COMMUNITY_POST_REACTIONS,
  emptyCommunityReactionCounts,
  getCommunityReactionTotal,
  shouldShowCommunityPost,
} from "@/lib/community/posts";
import type { GameSummary } from "@/lib/games/types";
import { createSocialNotification } from "@/lib/server/notification-service";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { ensureGameRowBySlug } from "@/lib/server/library-service";
import type { Database, Json } from "@/lib/supabase/database.types";
import type {
  CommunityPost,
  CommunityPostAuthor,
  CommunityPostComment,
  CommunityPostReactionType,
  UserContext,
} from "@/lib/types";
import type {
  CommunityPostBookmarkInput,
  CommunityPostCommentInput,
  CommunityPostCreateInput,
  CommunityPostDeleteInput,
  CommunityPostReactionInput,
} from "@/lib/validation/community-social";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "display_name" | "avatar_url" | "is_private"
>;
type GameRow = Database["public"]["Tables"]["games"]["Row"];
type PostRow = Database["public"]["Tables"]["community_posts"]["Row"];
type ReactionRow =
  Database["public"]["Tables"]["community_post_reactions"]["Row"];
type CommentRow =
  Database["public"]["Tables"]["community_post_comments"]["Row"];

function isMissingCommunityPostsTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "42703";
}

async function requireCommunityClient(user: UserContext) {
  if (user.isDemo || !isSupabaseConfigured()) {
    throw new Error("Community posts need Supabase authentication.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
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

function mapAuthor(
  profile: ProfileRow,
  user: UserContext,
  followedUserIds: Set<string>,
): CommunityPostAuthor {
  return {
    id: profile.id,
    displayName: profile.display_name ?? "Player",
    avatarUrl: profile.avatar_url,
    isCurrentUser: profile.id === user.userId,
    isFollowing: followedUserIds.has(profile.id),
  };
}

function mapComment(
  row: CommentRow,
  profile: ProfileRow,
  user: UserContext,
  followedUserIds: Set<string>,
): CommunityPostComment {
  return {
    id: row.id,
    author: mapAuthor(profile, user, followedUserIds),
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createDemoPost(user: UserContext): CommunityPost {
  const counts = emptyCommunityReactionCounts();
  counts.hype = 3;
  counts.like = 5;

  return {
    id: "demo-community-post",
    author: {
      id: user.userId,
      displayName: user.displayName ?? "Demo player",
      avatarUrl: user.avatarUrl,
      isCurrentUser: true,
      isFollowing: false,
    },
    body: "I just finished a great story-heavy RPG and need something with a strong world next. What should go on my weekend list?",
    visibility: "public",
    mood: "recommendation",
    imageUrl: null,
    game: null,
    reactionCounts: counts,
    reactionTotal: getCommunityReactionTotal(counts),
    commentCount: 1,
    viewerReaction: null,
    viewerBookmarked: false,
    comments: [
      {
        id: "demo-comment",
        author: {
          id: "demo-friend",
          displayName: "Backlog Buddy",
          avatarUrl: null,
          isCurrentUser: false,
          isFollowing: false,
        },
        body: "Try attaching your favorite game so people can recommend by vibe.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function getFollowedUserIds(user: UserContext) {
  const admin = createSupabaseAdminClient();
  if (!admin || user.isDemo || !isSupabaseConfigured()) {
    return new Set<string>();
  }

  const { data, error } = await admin
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.userId);

  if (isMissingCommunityPostsTable(error)) {
    return new Set<string>();
  }

  if (error) {
    throw new Error("Could not load followed players.");
  }

  return new Set((data ?? []).map((follow) => follow.following_id));
}

async function getBlockedUserIds(user: UserContext) {
  const admin = createSupabaseAdminClient();
  const blockedIds = new Set<string>();
  if (!admin || user.isDemo || !isSupabaseConfigured()) {
    return blockedIds;
  }

  const { data, error } = await admin
    .from("user_blocks")
    .select("blocker_user_id, blocked_user_id")
    .or(`blocker_user_id.eq.${user.userId},blocked_user_id.eq.${user.userId}`);

  if (isMissingCommunityPostsTable(error)) {
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

async function getProfiles(profileIds: string[]) {
  const admin = createSupabaseAdminClient();
  if (!admin || !profileIds.length) {
    return new Map<string, ProfileRow>();
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id, display_name, avatar_url, is_private")
    .in("id", [...new Set(profileIds)]);

  if (isMissingCommunityPostsTable(error)) {
    return new Map<string, ProfileRow>();
  }

  if (error) {
    throw new Error("Could not load community profiles.");
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

async function getGames(gameIds: string[]) {
  const admin = createSupabaseAdminClient();
  if (!admin || !gameIds.length) {
    return new Map<string, GameSummary>();
  }

  const { data, error } = await admin
    .from("games")
    .select("*")
    .in("id", [...new Set(gameIds)]);

  if (error) {
    throw new Error("Could not load post game attachments.");
  }

  return new Map((data ?? []).map((game) => [game.id, mapGameRow(game)]));
}

function canSeeProfile(
  profile: ProfileRow,
  user: UserContext,
  followedUserIds: Set<string>,
) {
  return (
    !profile.is_private ||
    profile.id === user.userId ||
    followedUserIds.has(profile.id)
  );
}

async function hydrateCommunityPosts(
  user: UserContext,
  rows: PostRow[],
  followedUserIds: Set<string>,
  blockedUserIds: Set<string>,
) {
  const admin = createSupabaseAdminClient();
  if (!admin || !rows.length) {
    return [];
  }

  const authorProfiles = await getProfiles(rows.map((row) => row.user_id));
  const visibleRows = rows
    .filter((row) => {
      const profile = authorProfiles.get(row.user_id);
      return (
        Boolean(profile) &&
        canSeeProfile(profile!, user, followedUserIds) &&
        shouldShowCommunityPost({
          authorId: row.user_id,
          visibility: row.visibility,
          viewerId: user.userId,
          followedUserIds,
          blockedUserIds,
        })
      );
    })
    .slice(0, 40);

  if (!visibleRows.length) {
    return [];
  }

  const postIds = visibleRows.map((row) => row.id);
  const gameIds = visibleRows
    .map((row) => row.game_id)
    .filter((id): id is string => Boolean(id));
  const [gamesById, reactionsResult, commentsResult, bookmarksResult] =
    await Promise.all([
      getGames(gameIds),
      admin.from("community_post_reactions").select("*").in("post_id", postIds),
      admin
        .from("community_post_comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: false })
        .limit(Math.max(postIds.length * 5, 20)),
      admin
        .from("community_post_bookmarks")
        .select("post_id")
        .eq("user_id", user.userId)
        .in("post_id", postIds),
    ]);

  if (
    reactionsResult.error &&
    !isMissingCommunityPostsTable(reactionsResult.error)
  ) {
    throw new Error("Could not load post reactions.");
  }
  if (
    commentsResult.error &&
    !isMissingCommunityPostsTable(commentsResult.error)
  ) {
    throw new Error("Could not load post comments.");
  }
  if (
    bookmarksResult.error &&
    !isMissingCommunityPostsTable(bookmarksResult.error)
  ) {
    throw new Error("Could not load post bookmarks.");
  }

  const reactionCountsByPostId = new Map<
    string,
    Record<CommunityPostReactionType, number>
  >();
  const viewerReactionsByPostId = new Map<string, CommunityPostReactionType>();

  for (const reaction of reactionsResult.data ?? []) {
    const current =
      reactionCountsByPostId.get(reaction.post_id) ??
      emptyCommunityReactionCounts();
    current[reaction.reaction] += 1;
    reactionCountsByPostId.set(reaction.post_id, current);

    if (reaction.user_id === user.userId) {
      viewerReactionsByPostId.set(reaction.post_id, reaction.reaction);
    }
  }

  const comments = commentsResult.data ?? [];
  const commentProfilesById = await getProfiles(
    comments.map((comment) => comment.user_id),
  );
  const commentsByPostId = new Map<string, CommunityPostComment[]>();
  const commentCountsByPostId = new Map<string, number>();

  for (const comment of comments) {
    const profile = commentProfilesById.get(comment.user_id);
    if (!profile || !canSeeProfile(profile, user, followedUserIds)) {
      continue;
    }

    commentCountsByPostId.set(
      comment.post_id,
      (commentCountsByPostId.get(comment.post_id) ?? 0) + 1,
    );

    const current = commentsByPostId.get(comment.post_id) ?? [];
    if (current.length < 3) {
      commentsByPostId.set(comment.post_id, [
        ...current,
        mapComment(comment, profile, user, followedUserIds),
      ]);
    }
  }

  const bookmarkedPostIds = new Set(
    (bookmarksResult.data ?? []).map((bookmark) => bookmark.post_id),
  );

  return visibleRows.map((row) => {
    const authorProfile = authorProfiles.get(row.user_id)!;
    const reactionCounts =
      reactionCountsByPostId.get(row.id) ?? emptyCommunityReactionCounts();
    const commentsForPost = commentsByPostId.get(row.id) ?? [];

    return {
      id: row.id,
      author: mapAuthor(authorProfile, user, followedUserIds),
      body: row.body,
      visibility: row.visibility,
      mood: row.mood,
      imageUrl: row.image_url,
      game: row.game_id ? (gamesById.get(row.game_id) ?? null) : null,
      reactionCounts,
      reactionTotal: getCommunityReactionTotal(reactionCounts),
      commentCount: Math.max(
        commentCountsByPostId.get(row.id) ?? 0,
        commentsForPost.length,
      ),
      viewerReaction: viewerReactionsByPostId.get(row.id) ?? null,
      viewerBookmarked: bookmarkedPostIds.has(row.id),
      comments: commentsForPost.reverse(),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

export async function getCommunityPosts(
  user: UserContext,
  limit = 40,
): Promise<CommunityPost[]> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return [createDemoPost(user)];
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return [];
  }

  const [followedUserIds, blockedUserIds] = await Promise.all([
    getFollowedUserIds(user),
    getBlockedUserIds(user),
  ]);

  const { data, error } = await admin
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.max(limit * 2, 60));

  if (isMissingCommunityPostsTable(error)) {
    return [];
  }

  if (error) {
    throw new Error("Could not load community posts.");
  }

  return hydrateCommunityPosts(
    user,
    (data ?? []).slice(0, Math.max(limit * 2, 60)),
    followedUserIds,
    blockedUserIds,
  );
}

export async function getCommunityPostById(
  user: UserContext,
  postId: string,
): Promise<CommunityPost | null> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return createDemoPost(user);
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  const [followedUserIds, blockedUserIds] = await Promise.all([
    getFollowedUserIds(user),
    getBlockedUserIds(user),
  ]);
  const { data, error } = await admin
    .from("community_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (isMissingCommunityPostsTable(error)) {
    return null;
  }

  if (error || !data) {
    return null;
  }

  const [post] = await hydrateCommunityPosts(
    user,
    [data],
    followedUserIds,
    blockedUserIds,
  );
  return post ?? null;
}

async function getGameIdBySlug(gameSlug: string | null) {
  if (!gameSlug) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Game attachments need Supabase admin access.");
  }

  try {
    const game = await ensureGameRowBySlug(admin, gameSlug);
    return game.id;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("could not find")
    ) {
      throw new Error("Choose a game from the attachment search results.");
    }
    throw error;
  }
}

export async function createCommunityPost(
  user: UserContext,
  input: CommunityPostCreateInput,
) {
  const supabase = await requireCommunityClient(user);
  const gameId = await getGameIdBySlug(input.gameSlug);
  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.userId,
      game_id: gameId,
      body: input.body,
      visibility: input.visibility,
      mood: input.mood,
      image_url: input.imageUrl,
    })
    .select("*")
    .single();

  if (isMissingCommunityPostsTable(error)) {
    throw new Error("Community posts need the latest Supabase migration.");
  }

  if (error || !data) {
    throw new Error("Could not publish that post.");
  }

  return getCommunityPostById(user, data.id);
}

function buildReactionCounts(reactions: ReactionRow[]) {
  const counts = emptyCommunityReactionCounts();
  for (const reaction of reactions) {
    counts[reaction.reaction] += 1;
  }
  return counts;
}

async function getPostNotificationTarget(postId: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  const { data: post, error } = await admin
    .from("community_posts")
    .select("id, user_id, game_id")
    .eq("id", postId)
    .maybeSingle();

  if (error || !post) {
    return null;
  }

  const game = post.game_id
    ? (
        await admin
          .from("games")
          .select("slug, title")
          .eq("id", post.game_id)
          .maybeSingle()
      ).data
    : null;

  return {
    recipientUserId: post.user_id,
    gameTitle: game?.title ?? "your community post",
    linkHref: `/community?post=${post.id}`,
  };
}

export async function toggleCommunityPostReaction(
  user: UserContext,
  input: CommunityPostReactionInput,
) {
  const supabase = await requireCommunityClient(user);
  const { data: existing, error: existingError } = await supabase
    .from("community_post_reactions")
    .select("*")
    .eq("post_id", input.postId)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (isMissingCommunityPostsTable(existingError)) {
    throw new Error(
      "Community post reactions need the latest Supabase migration.",
    );
  }

  if (existingError) {
    throw new Error("Could not check your reaction.");
  }

  const shouldRemove = existing?.reaction === input.reaction;
  const result = shouldRemove
    ? await supabase
        .from("community_post_reactions")
        .delete()
        .eq("post_id", input.postId)
        .eq("user_id", user.userId)
    : existing
      ? await supabase
          .from("community_post_reactions")
          .update({ reaction: input.reaction })
          .eq("post_id", input.postId)
          .eq("user_id", user.userId)
      : await supabase.from("community_post_reactions").insert({
          post_id: input.postId,
          user_id: user.userId,
          reaction: input.reaction,
        });

  if (result.error) {
    throw new Error("Could not update that reaction.");
  }

  const { data: reactions, error: reactionsError } = await supabase
    .from("community_post_reactions")
    .select("*")
    .eq("post_id", input.postId);

  if (reactionsError) {
    throw new Error("Could not reload reaction counts.");
  }

  if (!shouldRemove) {
    const target = await getPostNotificationTarget(input.postId);
    if (target) {
      await createSocialNotification({
        recipientUserId: target.recipientUserId,
        actor: user,
        type: "reaction",
        title: "New post reaction",
        body: `${user.displayName ?? "A Playnira player"} reacted to ${target.gameTitle}.`,
        linkHref: target.linkHref,
        metadata: {
          postId: input.postId,
          reaction: input.reaction,
        },
      });
    }
  }

  const reactionCounts = buildReactionCounts(reactions ?? []);
  return {
    viewerReaction: shouldRemove ? null : input.reaction,
    reactionCounts,
    reactionTotal: getCommunityReactionTotal(reactionCounts),
  };
}

export async function addCommunityPostComment(
  user: UserContext,
  input: CommunityPostCommentInput,
) {
  const supabase = await requireCommunityClient(user);
  const { data: comment, error } = await supabase
    .from("community_post_comments")
    .insert({
      post_id: input.postId,
      user_id: user.userId,
      body: input.body,
    })
    .select("*")
    .single();

  if (isMissingCommunityPostsTable(error)) {
    throw new Error(
      "Community post comments need the latest Supabase migration.",
    );
  }

  if (error || !comment) {
    throw new Error("Could not post that comment.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, is_private")
    .eq("id", user.userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Could not load your profile for the comment.");
  }

  const target = await getPostNotificationTarget(input.postId);
  if (target) {
    await createSocialNotification({
      recipientUserId: target.recipientUserId,
      actor: user,
      type: "comment",
      title: "New post comment",
      body: `${user.displayName ?? "A Playnira player"} commented on ${target.gameTitle}.`,
      linkHref: target.linkHref,
      metadata: { postId: input.postId, commentId: comment.id },
    });
  }

  const followedUserIds = await getFollowedUserIds(user);
  return mapComment(comment, profile, user, followedUserIds);
}

export async function toggleCommunityPostBookmark(
  user: UserContext,
  input: CommunityPostBookmarkInput,
) {
  const supabase = await requireCommunityClient(user);
  const { data: existing, error: existingError } = await supabase
    .from("community_post_bookmarks")
    .select("post_id")
    .eq("post_id", input.postId)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (isMissingCommunityPostsTable(existingError)) {
    throw new Error("Post bookmarks need the latest Supabase migration.");
  }

  if (existingError) {
    throw new Error("Could not check that bookmark.");
  }

  const bookmarked = !existing;
  const result = bookmarked
    ? await supabase.from("community_post_bookmarks").insert({
        post_id: input.postId,
        user_id: user.userId,
      })
    : await supabase
        .from("community_post_bookmarks")
        .delete()
        .eq("post_id", input.postId)
        .eq("user_id", user.userId);

  if (result.error) {
    throw new Error("Could not update that bookmark.");
  }

  return { bookmarked };
}

export async function deleteCommunityPost(
  user: UserContext,
  input: CommunityPostDeleteInput,
) {
  const supabase = await requireCommunityClient(user);
  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", input.postId)
    .eq("user_id", user.userId);

  if (isMissingCommunityPostsTable(error)) {
    throw new Error("Community posts need the latest Supabase migration.");
  }

  if (error) {
    throw new Error("Could not delete that post.");
  }
}

export function getCommunityPostReactionLabel(
  reaction: CommunityPostReactionType,
) {
  return (
    COMMUNITY_POST_REACTIONS.find((item) => item.type === reaction)?.label ??
    "Reaction"
  );
}
