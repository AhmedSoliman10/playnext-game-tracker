import { NextRequest, NextResponse } from "next/server";
import { getSafeNextPath, OAUTH_NEXT_COOKIE } from "@/lib/auth/env";
import {
  getDiscordProfileFromUser,
  syncDiscordProfileToProfile,
} from "@/lib/auth/discord-profile";
import { getDiscordAuthErrorReason } from "@/lib/auth/oauth-errors";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

function oauthErrorRedirect(
  request: NextRequest,
  reason: string,
  next = "/dashboard",
) {
  const targetPath = next.startsWith("/settings") ? "/settings" : "/login";
  const targetUrl = new URL(targetPath, request.url);
  targetUrl.searchParams.set(
    targetPath === "/settings" ? "discord_error" : "oauth_error",
    reason,
  );
  const response = NextResponse.redirect(targetUrl);
  response.cookies.delete(OAUTH_NEXT_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");
  const next = getSafeNextPath(
    requestUrl.searchParams.get("next") ??
      request.cookies.get(OAUTH_NEXT_COOKIE)?.value ??
      null,
  );

  if (oauthError) {
    return oauthErrorRedirect(
      request,
      getDiscordAuthErrorReason(
        [
          oauthError,
          requestUrl.searchParams.get("error_code"),
          requestUrl.searchParams.get("error_description"),
        ]
          .filter(Boolean)
          .join(" "),
      ),
      next,
    );
  }

  if (!code) {
    return oauthErrorRedirect(request, "missing-code", next);
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.delete(OAUTH_NEXT_COOKIE);
  const supabase = createSupabaseRouteClient(request, response);
  const { error } = await supabase!.auth.exchangeCodeForSession(code);

  if (error) {
    const reason = getDiscordAuthErrorReason(
      [error.name, error.message].join(" "),
    );
    console.warn("OAuth callback code exchange failed", {
      reason,
      errorName: error.name,
      errorCode: error.code,
      errorStatus: error.status,
    });
    return oauthErrorRedirect(request, reason, next);
  }

  const {
    data: { user },
  } = await supabase!.auth.getUser();
  const discord = user ? getDiscordProfileFromUser(user) : null;
  if (user && discord) {
    await syncDiscordProfileToProfile(supabase!, user.id, discord);
  }

  return response;
}
