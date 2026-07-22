import { NextRequest, NextResponse } from "next/server";
import { APP_URL, isSupabaseConfigured } from "@/lib/auth/env";
import { clientRateLimitKey, errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { forgotPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const input = forgotPasswordSchema.parse(body);
  const limit = checkRateLimit(
    clientRateLimitKey(request, `forgot:${input.email}`),
    {
      limit: 4,
      windowMs: 60_000,
    },
  );

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many reset requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  try {
    if (isSupabaseConfigured()) {
      const response = NextResponse.json({
        ok: true,
        message: "If that email exists, a reset link is on the way.",
      });
      const supabase = createSupabaseRouteClient(request, response);
      const { error } = await supabase!.auth.resetPasswordForEmail(
        input.email,
        {
          redirectTo: `${APP_URL}/auth/callback`,
        },
      );

      if (error) {
        return NextResponse.json(
          { error: "We could not start the reset flow. Please try again." },
          { status: 400 },
        );
      }

      return response;
    }

    return NextResponse.json({
      ok: true,
      message:
        "Demo mode does not store passwords. Use any valid email and password to sign in.",
    });
  } catch (error) {
    return errorResponse(error, "Could not start password reset.");
  }
}
