import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/current-user";
import { getRecommendationBatch } from "@/lib/server/discovery-candidate-service";
import { errorResponse } from "@/lib/server/http";
import {
  getDiscoveryInteractionSlugs,
  getLibraryEntries,
} from "@/lib/server/library-service";
import { getRecommendationFeedback } from "@/lib/server/recommendation-feedback-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  try {
    const entries = await getLibraryEntries(user);
    const feedback = await getRecommendationFeedback(user);
    const discoverySlugs = await getDiscoveryInteractionSlugs(user);

    return NextResponse.json({
      recommendations: await getRecommendationBatch({
        entries,
        discoverySlugs,
        feedback,
        limit: 8,
      }),
    });
  } catch (error) {
    return errorResponse(error, "Could not load recommendations.");
  }
}
