import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/current-user";
import { addActivityComment } from "@/lib/server/community-social-service";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { activityCommentSchema } from "@/lib/validation/community-social";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`activity-comments:${user.userId}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are commenting quickly. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const input = activityCommentSchema.parse(await readJson(request));
    return NextResponse.json({
      comment: await addActivityComment(user, input),
    });
  } catch (error) {
    return errorResponse(error, "Could not post that comment.");
  }
}
