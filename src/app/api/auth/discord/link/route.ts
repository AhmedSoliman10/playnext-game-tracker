import { NextRequest, NextResponse } from "next/server";
import {
  getAuthCallbackUrl,
  isSupabaseConfigured,
  OAUTH_NEXT_COOKIE,
} from "@/lib/auth/env";
import { getDiscordAuthErrorReason } from "@/lib/auth/oauth-errors";
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
  const nextAfterLink = "/settings?discord_linked=1";
  const fallbackResponse = settingsErrorRedirect(request, "discord");
  fallbackResponse.cookies.set(OAUTH_NEXT_COOKIE, nextAfterLink, {
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
      redirectTo: getAuthCallbackUrl(request),
    },
  });

  if (error || !data.url) {
    const reason = getDiscordAuthErrorReason(
      [error?.name, error?.message, error?.code, error?.status]
        .filter(Boolean)
        .join(" "),
    );
    console.warn("Discord identity link could not start", {
      reason,
      errorName: error?.name,
      errorCode: error?.code,
      errorStatus: error?.status,
    });
    const response = settingsErrorRedirect(request, reason);
    copyCookies(fallbackResponse, response);
    response.cookies.delete(OAUTH_NEXT_COOKIE);
    return response;
  }

  const redirectResponse = NextResponse.redirect(data.url);
  copyCookies(fallbackResponse, redirectResponse);
  return redirectResponse;
}
