import { SettingsForm } from "@/components/profile/settings-form";
import { isSupabaseConfigured } from "@/lib/auth/env";
import { getCurrentUser } from "@/lib/server/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  let avatarUrl: string | null = null;
  let displayName = user?.displayName ?? "Player";
  let isPrivate = false;

  if (user && !user.isDemo && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase!
      .from("profiles")
      .select("display_name, avatar_url, is_private")
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
    }
  }

  return (
    <SettingsForm
      displayName={displayName}
      avatarUrl={avatarUrl}
      isPrivate={isPrivate}
      demoMode={!isSupabaseConfigured() || Boolean(user?.isDemo)}
    />
  );
}
