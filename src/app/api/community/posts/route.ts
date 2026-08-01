import { NextResponse } from "next/server";
import {
  createCommunityPost,
  getCommunityPosts,
} from "@/lib/server/community-post-service";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { communityPostCreateSchema } from "@/lib/validation/community-social";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  try {
    return NextResponse.json({ posts: await getCommunityPosts(user) });
  } catch (error) {
    return errorResponse(error, "Could not load community posts.");
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`community-posts:${user.userId}`, {
    limit: 12,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are posting quickly. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const input = communityPostCreateSchema.parse(await readJson(request));
    return NextResponse.json({
      post: await createCommunityPost(user, input),
    });
  } catch (error) {
    return errorResponse(error, "Could not publish that post.");
  }
}
