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

function copyCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
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

  const redirectResponse = NextResponse.redirect(data.url);
  copyCookies(fallbackResponse, redirectResponse);
  return redirectResponse;
}
