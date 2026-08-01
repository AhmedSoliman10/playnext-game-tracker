import { CommunityClient } from "@/components/community/community-client";
import { getCommunityFeedStats } from "@/lib/community/posts";
import { getCommunityPosts } from "@/lib/server/community-post-service";
import {
  getCommunityActivityFeed,
  getCommunityProfiles,
} from "@/lib/server/community-service";
import { getCurrentUser } from "@/lib/server/current-user";
import type {
  CommunityFeedStats,
  CommunityPost,
  PublicActivityItem,
  PublicProfile,
} from "@/lib/types";

export const metadata = {
  title: "Community",
};

export default async function CommunityPage() {
  const user = await getCurrentUser();
  let profiles: PublicProfile[] = [];
  let activity: PublicActivityItem[] = [];
  let posts: CommunityPost[] = [];
  let stats: CommunityFeedStats = {
    postCount: 0,
    followingPostCount: 0,
    gamePostCount: 0,
    playerCount: 0,
  };
  let unavailable = false;

  try {
    if (user) {
      [profiles, activity, posts] = await Promise.all([
        getCommunityProfiles(user),
        getCommunityActivityFeed(user),
        getCommunityPosts(user),
      ]);
      stats = getCommunityFeedStats(posts);
    }
  } catch {
    unavailable = true;
  }

  return (
    <CommunityClient
      profiles={profiles}
      activity={activity}
      posts={posts}
      stats={stats}
      unavailable={unavailable}
    />
  );
}
