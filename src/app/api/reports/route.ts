import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/current-user";
import { reportContent } from "@/lib/server/community-social-service";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { reportSchema } from "@/lib/validation/community-social";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`reports:${user.userId}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are sending reports quickly. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const input = reportSchema.parse(await readJson(request));
    await reportContent(user, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Could not send that report.");
  }
}
