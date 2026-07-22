import { NextResponse } from "next/server";
import { ratingFormSchema } from "@/lib/validation/rating";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { saveRating } from "@/lib/server/library-service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`rating:${user.userId}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error:
          "You are saving ratings very quickly. Please pause for a moment.",
      },
      { status: 429 },
    );
  }

  try {
    const input = ratingFormSchema.parse(await readJson(request));
    return NextResponse.json({ entry: await saveRating(user, input) });
  } catch (error) {
    return errorResponse(error, "Could not save your rating.");
  }
}
