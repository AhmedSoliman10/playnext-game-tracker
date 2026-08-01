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
    const response = settingsErrorRedirect(request, "signed-out");
    copyCookies(fallbackResponse, response);
    return response;
  }

  const { data, error } = await supabase!.auth.linkIdentity({
    provider: "discord",
    options: {
      scopes: "identify email",
      redirectTo: getAuthCallbackUrl(request, "/settings?discord_linked=1"),
    },
  });

  if (error || !data.url) {
    const reason =
      error?.message.toLowerCase().includes("already") ||
      error?.message.toLowerCase().includes("exists")
        ? "already-linked"
        : "discord";
    const response = settingsErrorRedirect(request, reason);
    copyCookies(fallbackResponse, response);
    return response;
  }

  const redirectResponse = NextResponse.redirect(data.url);
  copyCookies(fallbackResponse, redirectResponse);
  return redirectResponse;
}
