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

  return {
    userId: user.id,
    email: user.email ?? null,
    displayName:
      typeof user.user_metadata.display_name === "string"
        ? user.user_metadata.display_name
        : (user.email?.split("@")[0] ?? "Player"),
    isDemo: false,
  };
}
