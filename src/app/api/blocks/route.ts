import { NextResponse } from "next/server";
import {
  blockPlayer,
  unblockPlayer,
} from "@/lib/server/community-social-service";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { blockUserSchema } from "@/lib/validation/community-social";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`blocks:${user.userId}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are updating blocks quickly. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const input = blockUserSchema.parse(await readJson(request));
    await blockPlayer(user, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Could not block that player.");
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
    const input = blockUserSchema.parse(await readJson(request));
    await unblockPlayer(user, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Could not unblock that player.");
  }
}
