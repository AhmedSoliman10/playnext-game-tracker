import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import {
  deleteNotification,
  getNotifications,
  markNotificationsRead,
} from "@/lib/server/notification-service";
import {
  notificationDeleteSchema,
  notificationReadSchema,
} from "@/lib/validation/notifications";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  try {
    return NextResponse.json(await getNotifications(user));
  } catch (error) {
    return errorResponse(error, "Could not load notifications.");
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

  const limit = checkRateLimit(`notifications:${user.userId}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "You are updating notifications quickly. Please slow down.",
      },
      { status: 429 },
    );
  }

  try {
    const input = notificationReadSchema.parse(await readJson(request));
    await markNotificationsRead(user, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Could not update notifications.");
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  try {
    const input = notificationDeleteSchema.parse(await readJson(request));
    await deleteNotification(user, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Could not delete notification.");
  }
}
