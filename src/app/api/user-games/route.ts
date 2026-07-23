import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import {
  getLibraryEntries,
  removeFromLibrary,
  unhideGame,
  updateFavorite,
  updateUserGameStatus,
} from "@/lib/server/library-service";
import {
  favoriteUpdateSchema,
  removeUserGameSchema,
  statusUpdateSchema,
  unhideUserGameSchema,
} from "@/lib/validation/status";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  try {
    return NextResponse.json({ entries: await getLibraryEntries(user) });
  } catch (error) {
    return errorResponse(error, "Could not load your library.");
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`status:${user.userId}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error:
          "You are updating games very quickly. Please pause for a moment.",
      },
      { status: 429 },
    );
  }

  try {
    const input = statusUpdateSchema.parse(await readJson(request));
    const entry = await updateUserGameStatus(user, input);
    return NextResponse.json({
      entry,
      skipped: input.status === "skipped",
      gameSlug: input.gameSlug,
    });
  } catch (error) {
    return errorResponse(error, "Could not update your game status.");
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

  try {
    const input = favoriteUpdateSchema.parse(await readJson(request));
    return NextResponse.json({ entry: await updateFavorite(user, input) });
  } catch (error) {
    return errorResponse(error, "Could not update favorite.");
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`unhide:${user.userId}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error:
          "You are unhiding games very quickly. Please pause for a moment.",
      },
      { status: 429 },
    );
  }

  try {
    const input = unhideUserGameSchema.parse(await readJson(request));
    return NextResponse.json({
      ok: true,
      entry: await unhideGame(user, input),
      gameSlug: input.gameSlug,
    });
  } catch (error) {
    return errorResponse(error, "Could not unhide that game.");
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

  const limit = checkRateLimit(`remove:${user.userId}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error:
          "You are removing games very quickly. Please pause for a moment.",
      },
      { status: 429 },
    );
  }

  try {
    const input = removeUserGameSchema.parse(await readJson(request));
    await removeFromLibrary(user, input);
    return NextResponse.json({ ok: true, gameSlug: input.gameSlug });
  } catch (error) {
    return errorResponse(error, "Could not remove the game from your library.");
  }
}
