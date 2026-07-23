import { NextRequest, NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/demo-session";
import { isSupabaseConfigured } from "@/lib/auth/env";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteAccountSchema } from "@/lib/validation/auth";

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  try {
    deleteAccountSchema.parse(await readJson(request));

    if (user.isDemo || !isSupabaseConfigured()) {
      const response = NextResponse.json({ ok: true, redirectTo: "/" });
      response.cookies.delete(DEMO_SESSION_COOKIE);
      return response;
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json(
        {
          error:
            "Account deletion needs a valid server-side Supabase service role key.",
        },
        { status: 503 },
      );
    }

    const { error } = await admin.auth.admin.deleteUser(user.userId);
    if (error) {
      return NextResponse.json(
        {
          error:
            "Could not delete your account. Check the Supabase service role key.",
        },
        { status: 503 },
      );
    }

    const response = NextResponse.json({ ok: true, redirectTo: "/" });
    response.cookies.delete(DEMO_SESSION_COOKIE);
    return response;
  } catch (error) {
    return errorResponse(error, "Could not delete account.");
  }
}
