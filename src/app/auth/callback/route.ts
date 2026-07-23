import { NextRequest, NextResponse } from "next/server";
import { getSafeNextPath } from "@/lib/auth/env";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(next, request.url));

  if (code) {
    const supabase = createSupabaseRouteClient(request, response);
    await supabase?.auth.exchangeCodeForSession(code);
  }

  return response;
}
