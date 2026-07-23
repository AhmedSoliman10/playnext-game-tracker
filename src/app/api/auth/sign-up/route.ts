import { NextRequest, NextResponse } from "next/server";
import {
  APP_URL,
  getAuthConfirmUrl,
  isSupabaseConfigured,
} from "@/lib/auth/env";
import {
  createDemoUser,
  DEMO_SESSION_COOKIE,
  encodeDemoSession,
} from "@/lib/auth/demo-session";
import { clientRateLimitKey, errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { signUpSchema } from "@/lib/validation/auth";

function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function isEmailRateLimitError(error: { code?: string; message: string }) {
  return (
    error.code === "over_email_send_rate_limit" ||
    error.message.toLowerCase().includes("email rate limit")
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const input = signUpSchema.parse(body);
    const limit = checkRateLimit(
      clientRateLimitKey(request, `sign-up:${input.email}`),
      {
        limit: 5,
        windowMs: 60_000,
      },
    );

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error:
            "Too many sign-up attempts. Please wait a minute and try again.",
        },
        { status: 429 },
      );
    }

    const response = NextResponse.json({ ok: true, redirectTo: "/dashboard" });

    if (!isSupabaseConfigured()) {
      const user = createDemoUser(input.email, input.displayName);
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
    const normalizedDisplayName = normalizeDisplayName(input.displayName);
    const { data: existingProfile, error: existingProfileError } =
      await supabase!
        .from("profiles")
        .select("id")
        .eq("display_name_normalized", normalizedDisplayName)
        .maybeSingle();

    if (!existingProfileError && existingProfile) {
      return NextResponse.json(
        { error: "That display name is taken. Choose another one." },
        { status: 409 },
      );
    }

    const { data, error } = await supabase!.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { display_name: input.displayName },
        emailRedirectTo: getAuthConfirmUrl(request, "/login?verified=1"),
      },
    });

    if (error) {
      if (isEmailRateLimitError(error)) {
        return NextResponse.json(
          {
            error:
              "Supabase email sending is temporarily rate-limited. Please wait a few minutes, or configure custom SMTP for production auth emails.",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error:
            "We could not create that account. The email may already be in use.",
        },
        { status: 400 },
      );
    }

    if (!data.session) {
      return NextResponse.json({
        ok: true,
        redirectTo: "/login?created=1",
      });
    }

    return response;
  } catch (error) {
    return errorResponse(error, "Could not create account.");
  }
}
