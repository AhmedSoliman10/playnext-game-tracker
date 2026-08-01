import { cookies } from "next/headers";
import {
  decodeDemoSession,
  DEMO_SESSION_COOKIE,
} from "@/lib/auth/demo-session";
import {
  getDiscordProfileFromUser,
  mapDiscordProfileRow,
  syncDiscordProfileToProfile,
} from "@/lib/auth/discord-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserContext } from "@/lib/types";

export async function getCurrentUser(): Promise<UserContext | null> {
  const cookieStore = await cookies();
  const demoUser = decodeDemoSession(
    cookieStore.get(DEMO_SESSION_COOKIE)?.value,
  );
  if (demoUser) {
    return demoUser;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const fallbackDisplayName =
    typeof user.user_metadata.display_name === "string"
      ? user.user_metadata.display_name
      : (user.email?.split("@")[0] ?? "Player");
  const fallbackAvatarUrl =
    typeof user.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;
  const { data: profileWithDiscord, error: profileError } = await supabase
    .from("profiles")
    .select(
      "display_name, avatar_url, discord_user_id, discord_username, discord_avatar_url, discord_connected_at",
    )
    .eq("id", user.id)
    .maybeSingle();
  const profile =
    profileError?.code === "42703"
      ? (
          await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle()
        ).data
      : profileWithDiscord;
  const discordFromIdentity = getDiscordProfileFromUser(user);
  const discordProfileRow =
    profile && "discord_user_id" in profile
      ? {
          discord_user_id:
            typeof profile.discord_user_id === "string"
              ? profile.discord_user_id
              : null,
          discord_username:
            "discord_username" in profile &&
            typeof profile.discord_username === "string"
              ? profile.discord_username
              : null,
          discord_avatar_url:
            "discord_avatar_url" in profile &&
            typeof profile.discord_avatar_url === "string"
              ? profile.discord_avatar_url
              : null,
          discord_connected_at:
            "discord_connected_at" in profile &&
            typeof profile.discord_connected_at === "string"
              ? profile.discord_connected_at
              : null,
        }
      : null;
  const discord =
    discordFromIdentity ??
    (discordProfileRow ? mapDiscordProfileRow(discordProfileRow) : null);

  if (discordFromIdentity) {
    await syncDiscordProfileToProfile(supabase, user.id, discordFromIdentity);
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    displayName: profile?.display_name ?? fallbackDisplayName,
    avatarUrl: profile?.avatar_url ?? fallbackAvatarUrl,
    discord,
    isDemo: false,
  };
}
