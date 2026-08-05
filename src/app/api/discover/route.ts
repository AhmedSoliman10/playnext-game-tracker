import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/current-user";
import { getDiscoveryCandidateBatch } from "@/lib/server/discovery-candidate-service";
import { errorResponse } from "@/lib/server/http";
import {
  getDiscoveryInteractionSlugs,
  getLibraryEntries,
} from "@/lib/server/library-service";
import { getRecommendationFeedback } from "@/lib/server/recommendation-feedback-service";

function parseCursor(value: string | null) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  try {
    const [entries, discoverySlugs, feedback] = await Promise.all([
      getLibraryEntries(user),
      getDiscoveryInteractionSlugs(user),
      getRecommendationFeedback(user),
    ]);
    const batch = await getDiscoveryCandidateBatch({
      entries,
      discoverySlugs,
      feedback,
      cursor: parseCursor(request.nextUrl.searchParams.get("cursor")),
    });

    return NextResponse.json(batch);
  } catch (error) {
    return errorResponse(error, "Could not load more discovery games.");
  }
}
