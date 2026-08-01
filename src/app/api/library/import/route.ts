import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { importLibraryCsv } from "@/lib/server/library-transfer-service";
import { libraryImportSchema } from "@/lib/validation/library-import";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`library-import:${user.userId}`, {
    limit: 6,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are importing quickly. Please wait a moment." },
      { status: 429 },
    );
  }

  try {
    const input = libraryImportSchema.parse(await readJson(request));
    return NextResponse.json(await importLibraryCsv(user, input));
  } catch (error) {
    return errorResponse(error, "Could not import your library.");
  }
}
