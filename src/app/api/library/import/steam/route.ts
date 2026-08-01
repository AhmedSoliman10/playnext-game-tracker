import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { importSteamLibrary } from "@/lib/server/steam-library-service";
import { steamLibraryImportSchema } from "@/lib/validation/library-import";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`steam-library-import:${user.userId}`, {
    limit: 3,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are importing from Steam quickly. Please wait a moment." },
      { status: 429 },
    );
  }

  try {
    const input = steamLibraryImportSchema.parse(await readJson(request));
    return NextResponse.json(await importSteamLibrary(user, input));
  } catch (error) {
    return errorResponse(error, "Could not import that Steam library.");
  }
}
