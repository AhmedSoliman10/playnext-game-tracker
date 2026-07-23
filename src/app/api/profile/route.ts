import { NextRequest, NextResponse } from "next/server";
import { APP_URL, isSupabaseConfigured } from "@/lib/auth/env";
import {
  createDemoUser,
  DEMO_SESSION_COOKIE,
  encodeDemoSession,
} from "@/lib/auth/demo-session";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/auth";

const DISPLAY_NAME_COOLDOWN_MS = 5 * 24 * 60 * 60 * 1000;

function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function formatCooldownDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

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
    const displayName = input.displayName.trim().replace(/\s+/g, " ");
    const normalizedDisplayName = normalizeDisplayName(displayName);

    if (user.isDemo || !isSupabaseConfigured()) {
      const updatedUser = createDemoUser(
        user.email ?? user.userId,
        displayName,
        avatarUrl,
      );
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
    const { data: currentProfile, error: currentProfileError } = await supabase!
      .from("profiles")
      .select("display_name_normalized, display_name_changed_at")
      .eq("id", user.userId)
      .maybeSingle();

    if (currentProfileError) {
      const { error } = await supabase!.from("profiles").upsert(
        {
          id: user.userId,
          display_name: displayName,
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
          displayName,
          avatarUrl,
        },
        message:
          "Profile updated. Apply the latest Supabase migration to enforce display-name uniqueness and the 5-day rename limit.",
      });
    }

    const isDisplayNameChanging =
      currentProfile?.display_name_normalized !== normalizedDisplayName;

    if (isDisplayNameChanging && currentProfile?.display_name_changed_at) {
      const changedAt = new Date(currentProfile.display_name_changed_at);
      const nextAllowedAt = new Date(
        changedAt.getTime() + DISPLAY_NAME_COOLDOWN_MS,
      );

      if (nextAllowedAt.getTime() > Date.now()) {
        throw new Error(
          `Display names can be changed every 5 days. Try again after ${formatCooldownDate(
            nextAllowedAt,
          )}.`,
        );
      }
    }

    if (isDisplayNameChanging) {
      const { data: existingProfile, error: existingProfileError } =
        await supabase!
          .from("profiles")
          .select("id")
          .eq("display_name_normalized", normalizedDisplayName)
          .neq("id", user.userId)
          .maybeSingle();

      if (existingProfileError) {
        throw new Error("Could not check display name availability.");
      }

      if (existingProfile) {
        throw new Error("That display name is taken. Choose another one.");
      }
    }

    const { error } = await supabase!.from("profiles").upsert(
      {
        id: user.userId,
        display_name: displayName,
        display_name_normalized: normalizedDisplayName,
        display_name_changed_at: isDisplayNameChanging
          ? new Date().toISOString()
          : (currentProfile?.display_name_changed_at ??
            new Date().toISOString()),
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
        displayName,
        avatarUrl,
      },
    });
  } catch (error) {
    return errorResponse(error, "Could not update profile.");
  }
}
