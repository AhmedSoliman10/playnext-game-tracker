import { NextRequest, NextResponse } from "next/server";
import {
  getAuthCallbackUrl,
  isSupabaseConfigured,
  OAUTH_NEXT_COOKIE,
} from "@/lib/auth/env";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

function settingsErrorRedirect(request: NextRequest, reason: string) {
  const url = new URL("/settings", request.url);
  url.searchParams.set("discord_error", reason);
  return NextResponse.redirect(url);
}

function copyCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return settingsErrorRedirect(request, "supabase");
  }

  const requestUrl = new URL(request.url);
  const fallbackResponse = settingsErrorRedirect(request, "discord");
  fallbackResponse.cookies.set(OAUTH_NEXT_COOKIE, "/settings", {
    httpOnly: true,
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 10,
  });

  const supabase = createSupabaseRouteClient(request, fallbackResponse);
  const { data: userData } = await supabase!.auth.getUser();
  if (!userData.user) {
    return settingsErrorRedirect(request, "signed-out");
  }

  const { data, error } = await supabase!.auth.linkIdentity({
    provider: "discord",
    options: {
      redirectTo: getAuthCallbackUrl(request, "/settings"),
    },
  });

  if (error || !data.url) {
    return fallbackResponse;
  }

  const redirectResponse = NextResponse.redirect(data.url);
  copyCookies(fallbackResponse, redirectResponse);
  return redirectResponse;
}
