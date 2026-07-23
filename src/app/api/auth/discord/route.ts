import { NextRequest, NextResponse } from "next/server";
import {
  getAuthCallbackUrl,
  getSafeNextPath,
  isSupabaseConfigured,
} from "@/lib/auth/env";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

function loginErrorRedirect(request: NextRequest, reason: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("oauth_error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return loginErrorRedirect(request, "supabase");
  }

  const requestUrl = new URL(request.url);
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const fallbackResponse = loginErrorRedirect(request, "discord");
  const supabase = createSupabaseRouteClient(request, fallbackResponse);
  const { data, error } = await supabase!.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: getAuthCallbackUrl(request, next),
    },
  });

  if (error || !data.url) {
    return fallbackResponse;
  }

  return NextResponse.redirect(data.url);
}
