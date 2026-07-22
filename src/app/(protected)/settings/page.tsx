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

  if (user && !user.isDemo && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase!
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.userId)
      .maybeSingle();
    displayName = data?.display_name ?? displayName;
    avatarUrl = data?.avatar_url ?? null;
  }

  return (
    <SettingsForm
      displayName={displayName}
      avatarUrl={avatarUrl}
      demoMode={!isSupabaseConfigured() || Boolean(user?.isDemo)}
    />
  );
}
