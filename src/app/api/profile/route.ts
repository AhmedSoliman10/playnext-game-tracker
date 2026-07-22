import { NextRequest, NextResponse } from "next/server";
import { APP_URL, isSupabaseConfigured } from "@/lib/auth/env";
import {
  DEMO_SESSION_COOKIE,
  encodeDemoSession,
} from "@/lib/auth/demo-session";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/auth";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  try {
    const input = profileSchema.parse(await readJson(request));
    const avatarUrl =
      input.avatarUrl && input.avatarUrl.length > 0 ? input.avatarUrl : null;

    if (user.isDemo || !isSupabaseConfigured()) {
      const updatedUser = {
        ...user,
        displayName: input.displayName,
      };
      const response = NextResponse.json({ profile: updatedUser });
      response.cookies.set(
        DEMO_SESSION_COOKIE,
        encodeDemoSession(updatedUser),
        {
          httpOnly: true,
          sameSite: "lax",
          secure: APP_URL.startsWith("https://"),
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        },
      );
      return response;
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase!.from("profiles").upsert(
      {
        id: user.userId,
        display_name: input.displayName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      throw new Error("Could not update your profile.");
    }

    return NextResponse.json({
      profile: {
        displayName: input.displayName,
        avatarUrl,
      },
    });
  } catch (error) {
    return errorResponse(error, "Could not update profile.");
  }
}
