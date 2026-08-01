import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { saveRecommendationFeedback } from "@/lib/server/recommendation-feedback-service";
import { recommendationFeedbackSchema } from "@/lib/validation/recommendation-feedback";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const limit = checkRateLimit(`recommendation-feedback:${user.userId}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are tuning recommendations quickly. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const input = recommendationFeedbackSchema.parse(await readJson(request));
    await saveRecommendationFeedback(user, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Could not save recommendation feedback.");
  }
}
