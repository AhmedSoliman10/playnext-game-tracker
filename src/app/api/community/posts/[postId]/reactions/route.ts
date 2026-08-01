import { NextResponse } from "next/server";
import { toggleCommunityPostReaction } from "@/lib/server/community-post-service";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { communityPostReactionInputSchema } from "@/lib/validation/community-social";

type CommunityPostReactionRouteContext = {
  params: Promise<{ postId: string }>;
};

function objectBody(body: unknown) {
  return body && typeof body === "object" && !Array.isArray(body) ? body : {};
}

export async function POST(
  request: Request,
  { params }: CommunityPostReactionRouteContext,
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`community-post-reactions:${user.userId}`, {
    limit: 100,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are reacting quickly. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const { postId } = await params;
    const input = communityPostReactionInputSchema.parse({
      ...objectBody(await readJson(request)),
      postId,
    });
    return NextResponse.json(await toggleCommunityPostReaction(user, input));
  } catch (error) {
    return errorResponse(error, "Could not update that reaction.");
  }
}
