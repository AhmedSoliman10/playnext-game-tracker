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

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function discordErrorMessage(reason?: string) {
  if (reason === "signed-out") {
    return "Sign in again, then connect Discord from Settings.";
  }

  if (reason === "already-linked") {
    return "That Discord account is already connected to another Playnira account. Sign in with that Discord account first, or use a different Discord account.";
  }

  if (reason === "manual-linking-disabled") {
    return "Supabase is blocking Discord account linking because Enable Manual Linking is off. In Supabase, open Authentication > Providers and enable Manual Linking, then try again.";
  }

  if (reason === "missing-code") {
    return "Discord did not return a valid authorization code. Please try connecting again.";
  }

  if (reason === "discord") {
    return "Discord could not be connected. Check the Supabase Discord provider setup and try again.";
  }

  if (reason === "provider-disabled") {
    return "Discord is not enabled in Supabase yet. Turn on the Discord provider, then try again.";
  }

  if (reason === "redirect-url") {
    return "Supabase blocked the Discord callback URL. Add https://playnira-game-tracker.vercel.app/auth/callback to the Supabase redirect URLs, then try again.";
  }

  if (reason === "supabase") {
    return "Supabase authentication is not configured for this deployment.";
  }

  return null;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawSearchParams = await searchParams;
  const discordError = discordErrorMessage(
    firstParam(rawSearchParams.discord_error),
  );
  const discordSuccess =
    firstParam(rawSearchParams.discord_linked) === "1"
      ? "Discord is connected to your Playnira profile."
      : null;
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
      discordError={discordError}
      discordSuccess={discordSuccess}
      notificationPreferences={notificationPreferences}
      demoMode={!isSupabaseConfigured() || Boolean(user?.isDemo)}
    />
  );
}
