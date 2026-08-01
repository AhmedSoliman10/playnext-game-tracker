import { NextResponse } from "next/server";
import { toggleCommunityPostBookmark } from "@/lib/server/community-post-service";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { communityPostBookmarkSchema } from "@/lib/validation/community-social";

type CommunityPostBookmarkRouteContext = {
  params: Promise<{ postId: string }>;
};

export async function POST(
  _request: Request,
  { params }: CommunityPostBookmarkRouteContext,
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`community-post-bookmarks:${user.userId}`, {
    limit: 80,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Bookmark changes are moving quickly. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const { postId } = await params;
    const input = communityPostBookmarkSchema.parse({ postId });
    return NextResponse.json(await toggleCommunityPostBookmark(user, input));
  } catch (error) {
    return errorResponse(error, "Could not update that bookmark.");
  }
}
