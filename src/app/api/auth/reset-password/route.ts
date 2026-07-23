import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth/env";
import { clientRateLimitKey, errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { resetPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const input = resetPasswordSchema.parse(body);
    const limit = checkRateLimit(
      clientRateLimitKey(request, "reset-password"),
      {
        limit: 5,
        windowMs: 60_000,
      },
    );

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error:
            "Too many password updates. Please wait a minute and try again.",
        },
        { status: 429 },
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        message: "Demo mode does not store passwords.",
      });
    }

    const response = NextResponse.json({
      ok: true,
      message: "Your password has been updated.",
    });
    const supabase = createSupabaseRouteClient(request, response);
    const { error } = await supabase!.auth.updateUser({
      password: input.password,
    });

    if (error) {
      return NextResponse.json(
        {
          error:
            "This reset session is no longer valid. Request a fresh reset link.",
        },
        { status: 401 },
      );
    }

    return response;
  } catch (error) {
    return errorResponse(error, "Could not update password.");
  }
}
