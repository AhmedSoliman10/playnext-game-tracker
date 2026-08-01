import type {
  CommunityFeedStats,
  CommunityPost,
  CommunityPostMood,
  CommunityPostReactionType,
  CommunityPostVisibility,
} from "@/lib/types";

export const COMMUNITY_POST_REACTIONS: Array<{
  type: CommunityPostReactionType;
  label: string;
}> = [
  { type: "like", label: "Like" },
  { type: "hype", label: "Hype" },
  { type: "played_it", label: "Played it" },
  { type: "backlog", label: "Backlog" },
];

export const COMMUNITY_POST_MOODS: Array<{
  value: CommunityPostMood;
  label: string;
}> = [
  { value: "discussion", label: "Discussion" },
  { value: "playing", label: "Playing" },
  { value: "completed", label: "Completed" },
  { value: "backlog", label: "Backlog" },
  { value: "recommendation", label: "Recommendation" },
];

export const COMMUNITY_POST_VISIBILITIES: Array<{
  value: CommunityPostVisibility;
  label: string;
}> = [
  { value: "public", label: "Public" },
  { value: "followers", label: "Followers" },
];

export function emptyCommunityReactionCounts(): Record<
  CommunityPostReactionType,
  number
> {
  return {
    like: 0,
    hype: 0,
    played_it: 0,
    backlog: 0,
  };
}

export function getCommunityReactionTotal(
  counts: Record<CommunityPostReactionType, number>,
) {
  return COMMUNITY_POST_REACTIONS.reduce(
    (total, reaction) => total + counts[reaction.type],
    0,
  );
}

export function shouldShowCommunityPost({
  authorId,
  visibility,
  viewerId,
  followedUserIds,
  blockedUserIds,
}: {
  authorId: string;
  visibility: CommunityPostVisibility;
  viewerId: string;
  followedUserIds: Set<string>;
  blockedUserIds: Set<string>;
}) {
  if (blockedUserIds.has(authorId)) {
    return false;
  }

  if (visibility === "public" || authorId === viewerId) {
    return true;
  }

  return followedUserIds.has(authorId);
}

export function getCommunityFeedStats(
  posts: CommunityPost[],
): CommunityFeedStats {
  return {
    postCount: posts.length,
    followingPostCount: posts.filter((post) => post.author.isFollowing).length,
    gamePostCount: posts.filter((post) => Boolean(post.game)).length,
    playerCount: new Set(posts.map((post) => post.author.id)).size,
  };
}

export function getDominantCommunityReaction(
  counts: Record<CommunityPostReactionType, number>,
) {
  return COMMUNITY_POST_REACTIONS.reduce<CommunityPostReactionType | null>(
    (dominant, reaction) => {
      if (!dominant) {
        return counts[reaction.type] > 0 ? reaction.type : null;
      }

      return counts[reaction.type] > counts[dominant]
        ? reaction.type
        : dominant;
    },
    null,
  );
}
