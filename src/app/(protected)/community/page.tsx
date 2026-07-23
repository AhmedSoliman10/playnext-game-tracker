import { CommunityClient } from "@/components/community/community-client";
import {
  getCommunityActivityFeed,
  getCommunityProfiles,
} from "@/lib/server/community-service";
import { getCurrentUser } from "@/lib/server/current-user";
import type { PublicActivityItem, PublicProfile } from "@/lib/types";

export const metadata = {
  title: "Community",
};

export default async function CommunityPage() {
  const user = await getCurrentUser();
  let profiles: PublicProfile[] = [];
  let activity: PublicActivityItem[] = [];
  let unavailable = false;

  try {
    if (user) {
      [profiles, activity] = await Promise.all([
        getCommunityProfiles(user),
        getCommunityActivityFeed(user),
      ]);
    }
  } catch {
    unavailable = true;
  }

  return (
    <CommunityClient
      profiles={profiles}
      activity={activity}
      unavailable={unavailable}
    />
  );
}
