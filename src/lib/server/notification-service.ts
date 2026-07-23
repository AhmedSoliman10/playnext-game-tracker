import { isSupabaseConfigured } from "@/lib/auth/env";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type {
  NotificationCenter,
  NotificationItem,
  UserContext,
} from "@/lib/types";
import type {
  NotificationDeleteInput,
  NotificationReadInput,
} from "@/lib/validation/notifications";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

function mapNotification(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.notification_type,
    title: row.title,
    body: row.body,
    linkHref: row.link_href,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

function isMissingNotificationsTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "42703";
}

export async function getNotifications(
  user: UserContext,
  limit = 20,
): Promise<NotificationCenter> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return { notifications: [], unreadCount: 0 };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { notifications: [], unreadCount: 0 };
  }

  const [notificationsResult, unreadResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("recipient_user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_user_id", user.userId)
      .is("read_at", null),
  ]);

  if (isMissingNotificationsTable(notificationsResult.error)) {
    return { notifications: [], unreadCount: 0 };
  }

  if (notificationsResult.error || unreadResult.error) {
    throw new Error("Could not load notifications.");
  }

  return {
    notifications: (notificationsResult.data ?? []).map(mapNotification),
    unreadCount: unreadResult.count ?? 0,
  };
}

export async function markNotificationsRead(
  user: UserContext,
  input: NotificationReadInput,
) {
  if (user.isDemo || !isSupabaseConfigured()) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const timestamp = new Date().toISOString();
  const query = supabase
    .from("notifications")
    .update({ read_at: timestamp, updated_at: timestamp })
    .eq("recipient_user_id", user.userId);

  const { error } = input.markAll
    ? await query.is("read_at", null)
    : await query.in("id", input.notificationIds ?? []);

  if (error) {
    throw new Error("Could not update notifications.");
  }
}

export async function deleteNotification(
  user: UserContext,
  input: NotificationDeleteInput,
) {
  if (user.isDemo || !isSupabaseConfigured()) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("recipient_user_id", user.userId)
    .eq("id", input.notificationId);

  if (error) {
    throw new Error("Could not delete that notification.");
  }
}

export async function createFollowNotification(
  follower: UserContext,
  followingId: string,
) {
  if (follower.isDemo || !isSupabaseConfigured()) {
    return;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const actorName = follower.displayName ?? "A PlayNext player";
  const { error } = await admin.from("notifications").insert({
    recipient_user_id: followingId,
    actor_user_id: follower.userId,
    notification_type: "followed_you",
    title: "New follower",
    body: `${actorName} followed you.`,
    link_href: `/players/${follower.userId}`,
    metadata: {
      actorDisplayName: actorName,
    },
  });

  if (error && !isMissingNotificationsTable(error)) {
    throw new Error("Could not create follow notification.");
  }
}
