import { NextResponse } from "next/server";
import { deleteCommunityPost } from "@/lib/server/community-post-service";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { communityPostDeleteSchema } from "@/lib/validation/community-social";

type CommunityPostRouteContext = {
  params: Promise<{ postId: string }>;
};

export async function DELETE(
  _request: Request,
  { params }: CommunityPostRouteContext,
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`community-post-delete:${user.userId}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Post changes are moving quickly. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const { postId } = await params;
    const input = communityPostDeleteSchema.parse({ postId });
    await deleteCommunityPost(user, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Could not delete that post.");
  }
}
