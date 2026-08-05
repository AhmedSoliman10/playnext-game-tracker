import { DiscoveryClient } from "@/components/discover/discovery-client";
import { getDiscoveryCandidateBatch } from "@/lib/server/discovery-candidate-service";
import { getCurrentUser } from "@/lib/server/current-user";
import {
  getDiscoveryInteractionSlugs,
  getLibraryEntries,
} from "@/lib/server/library-service";
import { getRecommendationFeedback } from "@/lib/server/recommendation-feedback-service";

export const metadata = {
  title: "Discover",
};

export default async function DiscoverPage() {
  const user = await getCurrentUser();
  const entries = user ? await getLibraryEntries(user) : [];
  const discoverySlugs = user ? await getDiscoveryInteractionSlugs(user) : [];
  const feedback = user ? await getRecommendationFeedback(user) : [];
  const discoveryBatch = await getDiscoveryCandidateBatch({
    entries,
    discoverySlugs,
    feedback,
  });

  return (
    <DiscoveryClient
      games={discoveryBatch.games}
      initialEntries={entries}
      initialAnsweredSlugs={discoverySlugs}
      initialNextCursor={discoveryBatch.nextCursor}
    />
  );
}
