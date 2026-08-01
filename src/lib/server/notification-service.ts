import { isSupabaseConfigured } from "@/lib/auth/env";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type {
  NotificationCenter,
  NotificationItem,
  NotificationPreferences,
  NotificationType,
  UserContext,
} from "@/lib/types";
import type {
  NotificationDeleteInput,
  NotificationReadInput,
} from "@/lib/validation/notifications";
import type { NotificationPreferencesInput } from "@/lib/validation/notification-preferences";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationPreferencesRow =
  Database["public"]["Tables"]["notification_preferences"]["Row"];

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  inAppFollowedYou: true,
  inAppReaction: true,
  inAppComment: true,
  inAppSystem: true,
  emailDigestEnabled: true,
  quietModeEnabled: false,
};

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

function mapNotificationPreferences(
  row?: NotificationPreferencesRow | null,
): NotificationPreferences {
  if (!row) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  return {
    inAppFollowedYou: row.in_app_followed_you,
    inAppReaction: row.in_app_reaction,
    inAppComment: row.in_app_comment,
    inAppSystem: row.in_app_system,
    emailDigestEnabled: row.email_digest_enabled,
    quietModeEnabled: row.quiet_mode_enabled,
  };
}

function preferenceEnabled(
  preferences: NotificationPreferences,
  type: NotificationType,
) {
  if (preferences.quietModeEnabled) {
    return false;
  }

  if (type === "followed_you") {
    return preferences.inAppFollowedYou;
  }

  if (type === "reaction") {
    return preferences.inAppReaction;
  }

  if (type === "comment") {
    return preferences.inAppComment;
  }

  return preferences.inAppSystem;
}

export async function getNotificationPreferences(
  user: UserContext,
): Promise<NotificationPreferences> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.userId)
    .maybeSingle();

  if (isMissingNotificationsTable(error)) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  if (error) {
    throw new Error("Could not load notification preferences.");
  }

  return mapNotificationPreferences(data);
}

export async function updateNotificationPreferences(
  user: UserContext,
  input: NotificationPreferencesInput,
): Promise<NotificationPreferences> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return input;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.userId,
        in_app_followed_you: input.inAppFollowedYou,
        in_app_reaction: input.inAppReaction,
        in_app_comment: input.inAppComment,
        in_app_system: input.inAppSystem,
        email_digest_enabled: input.emailDigestEnabled,
        quiet_mode_enabled: input.quietModeEnabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error("Could not update notification preferences.");
  }

  return mapNotificationPreferences(data);
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

  if (!(await shouldCreateNotification(admin, followingId, "followed_you"))) {
    return;
  }

  const actorName = follower.displayName ?? "A Playnira player";
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

export async function createSocialNotification({
  recipientUserId,
  actor,
  type,
  title,
  body,
  linkHref,
  metadata = {},
}: {
  recipientUserId: string;
  actor: UserContext;
  type: Extract<NotificationType, "reaction" | "comment">;
  title: string;
  body: string;
  linkHref: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  if (
    actor.isDemo ||
    actor.userId === recipientUserId ||
    !isSupabaseConfigured()
  ) {
    return;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  if (!(await shouldCreateNotification(admin, recipientUserId, type))) {
    return;
  }

  const { error } = await admin.from("notifications").insert({
    recipient_user_id: recipientUserId,
    actor_user_id: actor.userId,
    notification_type: type,
    title,
    body,
    link_href: linkHref,
    metadata,
  });

  if (error && !isMissingNotificationsTable(error)) {
    throw new Error("Could not create social notification.");
  }
}

async function shouldCreateNotification(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  recipientUserId: string,
  type: NotificationType,
) {
  const { data, error } = await admin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", recipientUserId)
    .maybeSingle();

  if (isMissingNotificationsTable(error)) {
    return true;
  }

  if (error) {
    throw new Error("Could not check notification preferences.");
  }

  return preferenceEnabled(mapNotificationPreferences(data), type);
}
