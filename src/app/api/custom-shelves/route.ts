import { NextResponse } from "next/server";
import { createCustomShelf } from "@/lib/server/custom-shelves-service";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { customShelfSchema } from "@/lib/validation/custom-shelves";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`custom-shelves:${user.userId}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are creating shelves quickly. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const input = customShelfSchema.parse(await readJson(request));
    return NextResponse.json({ shelf: await createCustomShelf(user, input) });
  } catch (error) {
    return errorResponse(error, "Could not create that shelf.");
  }
}
