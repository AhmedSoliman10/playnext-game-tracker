import { describe, expect, it } from "vitest";
import {
  emptyCommunityReactionCounts,
  getCommunityFeedStats,
  getCommunityReactionTotal,
  shouldShowCommunityPost,
} from "@/lib/community/posts";
import type { CommunityPost } from "@/lib/types";
import { communityPostCreateSchema } from "@/lib/validation/community-social";

describe("community post helpers", () => {
  it("keeps follower-only posts visible only to followers and the author", () => {
    expect(
      shouldShowCommunityPost({
        authorId: "author",
        visibility: "followers",
        viewerId: "viewer",
        followedUserIds: new Set(["author"]),
        blockedUserIds: new Set(),
      }),
    ).toBe(true);

    expect(
      shouldShowCommunityPost({
        authorId: "author",
        visibility: "followers",
        viewerId: "viewer",
        followedUserIds: new Set(),
        blockedUserIds: new Set(),
      }),
    ).toBe(false);

    expect(
      shouldShowCommunityPost({
        authorId: "author",
        visibility: "followers",
        viewerId: "author",
        followedUserIds: new Set(),
        blockedUserIds: new Set(),
      }),
    ).toBe(true);
  });

  it("lets blocks override public visibility", () => {
    expect(
      shouldShowCommunityPost({
        authorId: "blocked-player",
        visibility: "public",
        viewerId: "viewer",
        followedUserIds: new Set(["blocked-player"]),
        blockedUserIds: new Set(["blocked-player"]),
      }),
    ).toBe(false);
  });

  it("totals reaction counts and feed stats", () => {
    const counts = emptyCommunityReactionCounts();
    counts.like = 2;
    counts.hype = 1;

    expect(getCommunityReactionTotal(counts)).toBe(3);
    expect(getCommunityFeedStats(posts)).toEqual({
      postCount: 3,
      followingPostCount: 1,
      gamePostCount: 2,
      playerCount: 2,
    });
  });
});

describe("community post validation", () => {
  it("normalizes optional fields and defaults visibility", () => {
    expect(
      communityPostCreateSchema.parse({
        body: "  Anyone playing co-op this week? ",
        gameSlug: "  hades  ",
        imageUrl: null,
      }),
    ).toMatchObject({
      body: "Anyone playing co-op this week?",
      visibility: "public",
      mood: "discussion",
      gameSlug: "hades",
      imageUrl: null,
    });
  });

  it("rejects non-https image URLs", () => {
    expect(() =>
      communityPostCreateSchema.parse({
        body: "Screenshot thread",
        imageUrl: "http://example.com/screenshot.jpg",
      }),
    ).toThrow("Image URLs must use https.");
  });
});

const basePost: CommunityPost = {
  id: "post-1",
  author: {
    id: "author-1",
    displayName: "KiloPower",
    avatarUrl: null,
    isCurrentUser: false,
    isFollowing: true,
  },
  body: "What should I play after The Witcher 3?",
  visibility: "public",
  mood: "recommendation",
  imageUrl: null,
  game: null,
  reactionCounts: emptyCommunityReactionCounts(),
  reactionTotal: 0,
  commentCount: 0,
  viewerReaction: null,
  viewerBookmarked: false,
  comments: [],
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-01T12:00:00.000Z",
};

const posts: CommunityPost[] = [
  {
    ...basePost,
    id: "post-1",
    game: {
      id: "witcher-3",
      provider: "seed",
      providerGameId: "witcher-3",
      slug: "the-witcher-3-wild-hunt",
      title: "The Witcher 3: Wild Hunt",
      description: "Open-world RPG.",
      coverImageUrl: null,
      backgroundImageUrl: null,
      releaseDate: "2015-05-19",
      genres: ["RPG"],
      platforms: ["PC"],
      developer: null,
      publisher: null,
      externalRating: 9.3,
      estimatedPlaytime: 55,
      screenshots: [],
      metadata: {},
    },
  },
  {
    ...basePost,
    id: "post-2",
    author: {
      ...basePost.author,
      id: "author-2",
      isFollowing: false,
    },
    game: {
      id: "hades",
      provider: "seed",
      providerGameId: "hades",
      slug: "hades",
      title: "Hades",
      description: "Action roguelike.",
      coverImageUrl: null,
      backgroundImageUrl: null,
      releaseDate: "2020-09-17",
      genres: ["Action"],
      platforms: ["PC"],
      developer: null,
      publisher: null,
      externalRating: 9,
      estimatedPlaytime: 22,
      screenshots: [],
      metadata: {},
    },
  },
  {
    ...basePost,
    id: "post-3",
    author: {
      ...basePost.author,
      id: "author-1",
      isFollowing: false,
    },
    game: null,
  },
];
