import { CommunityClient } from "@/components/community/community-client";
import { getCommunityProfiles } from "@/lib/server/community-service";
import { getCurrentUser } from "@/lib/server/current-user";
import type { PublicProfile } from "@/lib/types";

export const metadata = {
  title: "Community",
};

export default async function CommunityPage() {
  const user = await getCurrentUser();
  let profiles: PublicProfile[] = [];
  let unavailable = false;

  try {
    profiles = user ? await getCommunityProfiles(user) : [];
  } catch {
    unavailable = true;
  }

  return <CommunityClient profiles={profiles} unavailable={unavailable} />;
}
