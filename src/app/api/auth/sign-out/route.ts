import { NextRequest, NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/demo-session";
import { isSupabaseConfigured } from "@/lib/auth/env";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true, redirectTo: "/" });
  response.cookies.set(DEMO_SESSION_COOKIE, "", { path: "/", maxAge: 0 });

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseRouteClient(request, response);
    await supabase?.auth.signOut();
  }

  return response;
}
