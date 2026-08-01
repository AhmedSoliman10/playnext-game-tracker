import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/server/notification-service";
import { notificationPreferencesSchema } from "@/lib/validation/notification-preferences";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  try {
    return NextResponse.json({
      preferences: await getNotificationPreferences(user),
    });
  } catch (error) {
    return errorResponse(error, "Could not load notification preferences.");
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`notification-preferences:${user.userId}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are saving notification settings quickly. Slow down." },
      { status: 429 },
    );
  }

  try {
    const input = notificationPreferencesSchema.parse(await readJson(request));
    return NextResponse.json({
      preferences: await updateNotificationPreferences(user, input),
    });
  } catch (error) {
    return errorResponse(error, "Could not save notification preferences.");
  }
}
