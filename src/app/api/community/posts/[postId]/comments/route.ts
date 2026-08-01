import { NextResponse } from "next/server";
import { addCommunityPostComment } from "@/lib/server/community-post-service";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { communityPostCommentSchema } from "@/lib/validation/community-social";

type CommunityPostCommentRouteContext = {
  params: Promise<{ postId: string }>;
};

function objectBody(body: unknown) {
  return body && typeof body === "object" && !Array.isArray(body) ? body : {};
}

export async function POST(
  request: Request,
  { params }: CommunityPostCommentRouteContext,
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`community-post-comments:${user.userId}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are commenting quickly. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const { postId } = await params;
    const input = communityPostCommentSchema.parse({
      ...objectBody(await readJson(request)),
      postId,
    });
    return NextResponse.json({
      comment: await addCommunityPostComment(user, input),
    });
  } catch (error) {
    return errorResponse(error, "Could not post that comment.");
  }
}
