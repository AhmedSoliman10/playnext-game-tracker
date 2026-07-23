import { NextRequest, NextResponse } from "next/server";
import { getSafeNextPath, OAUTH_NEXT_COOKIE } from "@/lib/auth/env";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

function oauthErrorRedirect(request: NextRequest, reason: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("oauth_error", reason);
  const response = NextResponse.redirect(loginUrl);
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
    return oauthErrorRedirect(request, "discord");
  }

  if (!code) {
    return oauthErrorRedirect(request, "missing-code");
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.delete(OAUTH_NEXT_COOKIE);
  const supabase = createSupabaseRouteClient(request, response);
  const { error } = await supabase!.auth.exchangeCodeForSession(code);

  if (error) {
    return oauthErrorRedirect(request, "discord");
  }

  return response;
}
