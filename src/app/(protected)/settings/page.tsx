import { SettingsForm } from "@/components/profile/settings-form";
import { isSupabaseConfigured } from "@/lib/auth/env";
import { getCurrentUser } from "@/lib/server/current-user";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationPreferences,
} from "@/lib/server/notification-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DiscordProfile } from "@/lib/types";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  let avatarUrl: string | null = null;
  let displayName = user?.displayName ?? "Player";
  let isPrivate = false;
  let discord: DiscordProfile | null = user?.discord ?? null;
  const notificationPreferences = user
    ? await getNotificationPreferences(user)
    : DEFAULT_NOTIFICATION_PREFERENCES;

  if (user && !user.isDemo && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase!
      .from("profiles")
      .select(
        "display_name, avatar_url, is_private, discord_user_id, discord_username, discord_avatar_url, discord_connected_at",
      )
      .eq("id", user.userId)
      .maybeSingle();

    if (error?.code === "42703") {
      const { data: fallbackData } = await supabase!
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.userId)
        .maybeSingle();
      displayName = fallbackData?.display_name ?? displayName;
      avatarUrl = fallbackData?.avatar_url ?? null;
    } else {
      displayName = data?.display_name ?? displayName;
      avatarUrl = data?.avatar_url ?? null;
      isPrivate = data?.is_private ?? false;
      discord =
        user.discord ??
        (data?.discord_user_id
          ? {
              connected: true,
              userId: data.discord_user_id,
              username: data.discord_username,
              avatarUrl: data.discord_avatar_url,
              connectedAt: data.discord_connected_at,
            }
          : null);
    }
  }

  return (
    <SettingsForm
      displayName={displayName}
      avatarUrl={avatarUrl}
      isPrivate={isPrivate}
      discord={discord}
      notificationPreferences={notificationPreferences}
      demoMode={!isSupabaseConfigured() || Boolean(user?.isDemo)}
    />
  );
}
