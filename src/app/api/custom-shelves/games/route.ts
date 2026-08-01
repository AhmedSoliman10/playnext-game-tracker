import { NextResponse } from "next/server";
import {
  addGameToCustomShelf,
  removeGameFromCustomShelf,
} from "@/lib/server/custom-shelves-service";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { shelfGameSchema } from "@/lib/validation/custom-shelves";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`custom-shelf-games:${user.userId}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are updating shelves quickly. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const input = shelfGameSchema.parse(await readJson(request));
    await addGameToCustomShelf(user, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Could not add that game to the shelf.");
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
    const input = shelfGameSchema.parse(await readJson(request));
    await removeGameFromCustomShelf(user, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Could not remove that game from the shelf.");
  }
}
