import { cookies } from "next/headers";
import {
  decodeDemoSession,
  DEMO_SESSION_COOKIE,
} from "@/lib/auth/demo-session";
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    displayName: profile?.display_name ?? fallbackDisplayName,
    avatarUrl: profile?.avatar_url ?? fallbackAvatarUrl,
    isDemo: false,
  };
}
