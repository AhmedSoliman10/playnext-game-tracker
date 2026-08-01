import { isSupabaseConfigured } from "@/lib/auth/env";
import { createSocialNotification } from "@/lib/server/notification-service";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { PublicActivityComment, UserContext } from "@/lib/types";
import type {
  ActivityCommentInput,
  ActivityReactionInput,
  BlockUserInput,
  ReportInput,
} from "@/lib/validation/community-social";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "display_name" | "avatar_url"
>;

function missingSocialTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "42703";
}

async function requireClient(user: UserContext) {
  if (user.isDemo || !isSupabaseConfigured()) {
    throw new Error("Community interactions need Supabase authentication.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

function mapComment(
  row: Database["public"]["Tables"]["activity_comments"]["Row"],
  profile: ProfileRow,
): PublicActivityComment {
  return {
    id: row.id,
    playerId: row.user_id,
    playerName: profile.display_name ?? "Player",
    playerAvatarUrl: profile.avatar_url,
    body: row.body,
    createdAt: row.created_at,
  };
}

async function getActivityNotificationTarget(activityId: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin
    .from("activity_log")
    .select("id, user_id, game_id")
    .eq("id", activityId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const { data: game } = await admin
    .from("games")
    .select("slug, title")
    .eq("id", data.game_id)
    .maybeSingle();

  return {
    recipientUserId: data.user_id,
    gameTitle: game?.title ?? "a game",
    linkHref: game?.slug ? `/games/${game.slug}` : "/community",
  };
}

export async function toggleActivityReaction(
  user: UserContext,
  input: ActivityReactionInput,
) {
  const supabase = await requireClient(user);
  const { data: existing, error: existingError } = await supabase
    .from("activity_reactions")
    .select("id")
    .eq("activity_id", input.activityId)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (missingSocialTable(existingError)) {
    throw new Error("Activity reactions need the latest Supabase migration.");
  }

  if (existingError) {
    throw new Error("Could not check your reaction.");
  }

  const reacted = !existing;
  const result = reacted
    ? await supabase.from("activity_reactions").insert({
        activity_id: input.activityId,
        user_id: user.userId,
        reaction: "like",
      })
    : await supabase
        .from("activity_reactions")
        .delete()
        .eq("activity_id", input.activityId)
        .eq("user_id", user.userId);

  if (result.error) {
    throw new Error("Could not update that reaction.");
  }

  const { count, error: countError } = await supabase
    .from("activity_reactions")
    .select("id", { count: "exact", head: true })
    .eq("activity_id", input.activityId);

  if (countError) {
    throw new Error("Could not reload reaction count.");
  }

  if (reacted) {
    const target = await getActivityNotificationTarget(input.activityId);
    if (target) {
      await createSocialNotification({
        recipientUserId: target.recipientUserId,
        actor: user,
        type: "reaction",
        title: "New activity reaction",
        body: `${user.displayName ?? "A Playnira player"} liked your ${target.gameTitle} activity.`,
        linkHref: target.linkHref,
        metadata: { activityId: input.activityId },
      });
    }
  }

  return { reacted, reactionCount: count ?? 0 };
}

export async function addActivityComment(
  user: UserContext,
  input: ActivityCommentInput,
): Promise<PublicActivityComment> {
  const supabase = await requireClient(user);
  const { data: comment, error } = await supabase
    .from("activity_comments")
    .insert({
      activity_id: input.activityId,
      user_id: user.userId,
      body: input.body,
    })
    .select("*")
    .single();

  if (missingSocialTable(error)) {
    throw new Error("Activity comments need the latest Supabase migration.");
  }

  if (error || !comment) {
    throw new Error("Could not post that comment.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Could not load your profile for the comment.");
  }

  const target = await getActivityNotificationTarget(input.activityId);
  if (target) {
    await createSocialNotification({
      recipientUserId: target.recipientUserId,
      actor: user,
      type: "comment",
      title: "New activity comment",
      body: `${user.displayName ?? "A Playnira player"} commented on your ${target.gameTitle} activity.`,
      linkHref: target.linkHref,
      metadata: { activityId: input.activityId, commentId: comment.id },
    });
  }

  return mapComment(comment, profile);
}

export async function blockPlayer(user: UserContext, input: BlockUserInput) {
  if (user.userId === input.blockedUserId) {
    throw new Error("You cannot block yourself.");
  }

  const supabase = await requireClient(user);
  const { error } = await supabase.from("user_blocks").upsert(
    {
      blocker_user_id: user.userId,
      blocked_user_id: input.blockedUserId,
    },
    { onConflict: "blocker_user_id,blocked_user_id" },
  );

  if (missingSocialTable(error)) {
    throw new Error("Blocking needs the latest Supabase migration.");
  }

  if (error) {
    throw new Error("Could not block that player.");
  }
}

export async function unblockPlayer(user: UserContext, input: BlockUserInput) {
  const supabase = await requireClient(user);
  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_user_id", user.userId)
    .eq("blocked_user_id", input.blockedUserId);

  if (missingSocialTable(error)) {
    throw new Error("Blocking needs the latest Supabase migration.");
  }

  if (error) {
    throw new Error("Could not unblock that player.");
  }
}

export async function reportContent(user: UserContext, input: ReportInput) {
  const supabase = await requireClient(user);
  const admin = createSupabaseAdminClient();
  let gameId: string | null = null;

  if (input.gameSlug && admin) {
    const { data: game } = await admin
      .from("games")
      .select("id")
      .eq("slug", input.gameSlug)
      .maybeSingle();
    gameId = game?.id ?? null;
  }

  const { error } = await supabase.from("moderation_reports").insert({
    reporter_user_id: user.userId,
    reported_user_id: input.reportedUserId ?? null,
    game_id: gameId,
    activity_id: input.activityId ?? null,
    rating_id: input.ratingId ?? null,
    comment_id: input.commentId ?? null,
    post_id: input.postId ?? null,
    post_comment_id: input.postCommentId ?? null,
    report_type: input.reportType,
    reason: input.reason,
  });

  if (missingSocialTable(error)) {
    throw new Error("Reports need the latest Supabase migration.");
  }

  if (error) {
    throw new Error("Could not send that report.");
  }
}
