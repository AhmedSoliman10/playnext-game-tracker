import { NextRequest, NextResponse } from "next/server";
import { APP_URL, isSupabaseConfigured } from "@/lib/auth/env";
import {
  createDemoUser,
  DEMO_SESSION_COOKIE,
  encodeDemoSession,
} from "@/lib/auth/demo-session";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { clientRateLimitKey, errorResponse, readJson } from "@/lib/server/http";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { signInSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const input = signInSchema.parse(body);
  const limit = checkRateLimit(
    clientRateLimitKey(request, `sign-in:${input.email}`),
    {
      limit: 8,
      windowMs: 60_000,
    },
  );

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "Too many sign-in attempts. Please wait a minute and try again.",
      },
      { status: 429 },
    );
  }

  const response = NextResponse.json({ ok: true, redirectTo: "/dashboard" });

  try {
    if (!isSupabaseConfigured()) {
      const user = createDemoUser(input.email);
      response.cookies.set(DEMO_SESSION_COOKIE, encodeDemoSession(user), {
        httpOnly: true,
        sameSite: "lax",
        secure: APP_URL.startsWith("https://"),
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    const supabase = createSupabaseRouteClient(request, response);
    const { error } = await supabase!.auth.signInWithPassword(input);
    if (error) {
      return NextResponse.json(
        { error: "We could not sign you in with those credentials." },
        { status: 401 },
      );
    }

    return response;
  } catch (error) {
    return errorResponse(error, "Could not sign in.");
  }
}
