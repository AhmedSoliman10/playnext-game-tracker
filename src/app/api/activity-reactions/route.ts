import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { toggleActivityReaction } from "@/lib/server/community-social-service";
import { activityReactionSchema } from "@/lib/validation/community-social";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`activity-reactions:${user.userId}`, {
    limit: 80,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are reacting quickly. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const input = activityReactionSchema.parse(await readJson(request));
    return NextResponse.json(await toggleActivityReaction(user, input));
  } catch (error) {
    return errorResponse(error, "Could not update that reaction.");
  }
}
