"use client";

import {
  Ban,
  Bookmark,
  Clipboard,
  Gamepad2,
  Globe2,
  Heart,
  Loader2,
  MessageSquareText,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserPlus,
  UserRound,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  COMMUNITY_POST_MOODS,
  COMMUNITY_POST_REACTIONS,
  COMMUNITY_POST_VISIBILITIES,
  getCommunityFeedStats,
} from "@/lib/community/posts";
import { GameArtwork } from "@/components/games/game-artwork";
import { RatingDetails } from "@/components/ratings/rating-details";
import { Button } from "@/components/ui/button";
import type { GameSummary } from "@/lib/games/types";
import type {
  CommunityFeedStats,
  CommunityPost,
  CommunityPostComment,
  CommunityPostMood,
  CommunityPostReactionType,
  CommunityPostVisibility,
  PublicActivityItem,
  PublicProfile,
} from "@/lib/types";
import { formatCompactDate } from "@/lib/utils";

type FeedMode = "for-you" | "following" | "games" | "saved";

type PostResponse = {
  post?: CommunityPost | null;
  error?: string;
};

type ReactionResponse = {
  viewerReaction?: CommunityPostReactionType | null;
  reactionCounts?: CommunityPost["reactionCounts"];
  reactionTotal?: number;
  error?: string;
};

type CommentResponse = {
  comment?: CommunityPostComment;
  error?: string;
};

type BookmarkResponse = {
  bookmarked?: boolean;
  error?: string;
};

type GameSearchResponse = {
  games?: GameSummary[];
  error?: string;
};

export function CommunityClient({
  profiles,
  activity,
  posts: initialPosts,
  stats: initialStats,
  unavailable = false,
}: {
  profiles: PublicProfile[];
  activity: PublicActivityItem[];
  posts: CommunityPost[];
  stats: CommunityFeedStats;
  unavailable?: boolean;
}) {
  const [items, setItems] = useState(profiles);
  const [feedItems, setFeedItems] = useState(activity);
  const [posts, setPosts] = useState(initialPosts);
  const [feedMode, setFeedMode] = useState<FeedMode>("for-you");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activityBusyId, setActivityBusyId] = useState<string | null>(null);
  const [postBusyId, setPostBusyId] = useState<string | null>(null);
  const [commentTextById, setCommentTextById] = useState<
    Record<string, string>
  >({});
  const [postCommentTextById, setPostCommentTextById] = useState<
    Record<string, string>
  >({});
  const [body, setBody] = useState("");
  const [visibility, setVisibility] =
    useState<CommunityPostVisibility>("public");
  const [mood, setMood] = useState<CommunityPostMood>("discussion");
  const [imageUrl, setImageUrl] = useState("");
  const [gameQuery, setGameQuery] = useState("");
  const [gameResults, setGameResults] = useState<GameSummary[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameSummary | null>(null);
  const [isSearchingGames, setIsSearchingGames] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentProfile = items.find((profile) => profile.isCurrentUser);
  const liveStats = useMemo(
    () => (posts.length ? getCommunityFeedStats(posts) : initialStats),
    [initialStats, posts],
  );
  const visiblePosts = useMemo(() => {
    if (feedMode === "following") {
      return posts.filter((post) => post.author.isFollowing);
    }

    if (feedMode === "games") {
      return posts.filter((post) => Boolean(post.game));
    }

    if (feedMode === "saved") {
      return posts.filter((post) => post.viewerBookmarked);
    }

    return posts;
  }, [feedMode, posts]);

  useEffect(() => {
    const query = gameQuery.trim();
    if (selectedGame || query.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearchingGames(true);
      fetch(`/api/games/search?q=${encodeURIComponent(query)}&pageSize=5`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          const payload = (await response.json()) as GameSearchResponse;
          if (!response.ok || payload.error) {
            throw new Error(payload.error ?? "Could not search games.");
          }
          setGameResults(payload.games ?? []);
        })
        .catch((caughtError) => {
          if (
            caughtError instanceof DOMException &&
            caughtError.name === "AbortError"
          ) {
            return;
          }
          setGameResults([]);
        })
        .finally(() => setIsSearchingGames(false));
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [gameQuery, selectedGame]);

  async function publishPost() {
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setError("Write something first.");
      return;
    }

    setError(null);
    setSuccess(null);
    setPostBusyId("create-post");

    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: trimmedBody,
          visibility,
          mood,
          gameSlug: selectedGame?.slug ?? null,
          imageUrl: imageUrl.trim() || null,
        }),
      });
      const payload = (await response.json()) as PostResponse;

      if (!response.ok || payload.error || !payload.post) {
        throw new Error(payload.error ?? "Could not publish that post.");
      }

      setPosts((current) => [payload.post!, ...current]);
      setBody("");
      setImageUrl("");
      setSelectedGame(null);
      setGameQuery("");
      setGameResults([]);
      setMood("discussion");
      setVisibility("public");
      setSuccess("Your post is live in the community feed.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not publish that post.",
      );
    } finally {
      setPostBusyId(null);
    }
  }

  async function reactToPost(
    post: CommunityPost,
    reaction: CommunityPostReactionType,
  ) {
    setError(null);
    setSuccess(null);
    setPostBusyId(`reaction:${post.id}:${reaction}`);

    try {
      const response = await fetch(
        `/api/community/posts/${post.id}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reaction }),
        },
      );
      const payload = (await response.json()) as ReactionResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not update that reaction.");
      }

      setPosts((current) =>
        current.map((candidate) =>
          candidate.id === post.id
            ? {
                ...candidate,
                viewerReaction: payload.viewerReaction ?? null,
                reactionCounts:
                  payload.reactionCounts ?? candidate.reactionCounts,
                reactionTotal: payload.reactionTotal ?? candidate.reactionTotal,
              }
            : candidate,
        ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update that reaction.",
      );
    } finally {
      setPostBusyId(null);
    }
  }

  async function submitPostComment(post: CommunityPost) {
    const commentBody = (postCommentTextById[post.id] ?? "").trim();
    if (!commentBody) {
      return;
    }

    setError(null);
    setSuccess(null);
    setPostBusyId(`comment:${post.id}`);

    try {
      const response = await fetch(`/api/community/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody }),
      });
      const payload = (await response.json()) as CommentResponse;

      if (!response.ok || payload.error || !payload.comment) {
        throw new Error(payload.error ?? "Could not post that comment.");
      }

      setPosts((current) =>
        current.map((candidate) =>
          candidate.id === post.id
            ? {
                ...candidate,
                comments: [...candidate.comments, payload.comment!],
                commentCount: candidate.commentCount + 1,
              }
            : candidate,
        ),
      );
      setPostCommentTextById((current) => ({ ...current, [post.id]: "" }));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not post that comment.",
      );
    } finally {
      setPostBusyId(null);
    }
  }

  async function togglePostBookmark(post: CommunityPost) {
    setError(null);
    setSuccess(null);
    setPostBusyId(`bookmark:${post.id}`);

    try {
      const response = await fetch(
        `/api/community/posts/${post.id}/bookmarks`,
        {
          method: "POST",
        },
      );
      const payload = (await response.json()) as BookmarkResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not update that bookmark.");
      }

      setPosts((current) =>
        current.map((candidate) =>
          candidate.id === post.id
            ? {
                ...candidate,
                viewerBookmarked: Boolean(payload.bookmarked),
              }
            : candidate,
        ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update that bookmark.",
      );
    } finally {
      setPostBusyId(null);
    }
  }

  async function deletePost(post: CommunityPost) {
    if (!window.confirm("Delete this post from the community feed?")) {
      return;
    }

    setError(null);
    setSuccess(null);
    setPostBusyId(`delete:${post.id}`);

    try {
      const response = await fetch(`/api/community/posts/${post.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not delete that post.");
      }

      setPosts((current) =>
        current.filter((candidate) => candidate.id !== post.id),
      );
      setSuccess("Post deleted.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete that post.",
      );
    } finally {
      setPostBusyId(null);
    }
  }

  async function sharePost(post: CommunityPost) {
    const href = `${window.location.origin}/community?post=${post.id}`;

    try {
      await navigator.clipboard.writeText(href);
      setSuccess("Post link copied.");
    } catch {
      setSuccess(href);
    }
  }

  async function reportPost(post: CommunityPost) {
    const reason = window.prompt("What should moderators review?");
    if (!reason?.trim()) {
      return;
    }

    setError(null);
    setSuccess(null);
    setPostBusyId(`report:${post.id}`);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "post",
          reportedUserId: post.author.id,
          postId: post.id,
          gameSlug: post.game?.slug ?? null,
          reason,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not send report.");
      }

      setSuccess("Thanks. Moderators can review that post.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not send report.",
      );
    } finally {
      setPostBusyId(null);
    }
  }

  async function toggleFollow(profile: PublicProfile) {
    setError(null);
    setSuccess(null);
    setBusyId(profile.id);
    const nextFollowing = !profile.isFollowing;

    try {
      const response = await fetch("/api/follows", {
        method: nextFollowing ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: profile.id }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not update follow.");
      }

      setItems((current) =>
        current.map((candidate) =>
          candidate.id === profile.id
            ? {
                ...candidate,
                isFollowing: nextFollowing,
                followersCount: Math.max(
                  0,
                  candidate.followersCount + (nextFollowing ? 1 : -1),
                ),
              }
            : candidate,
        ),
      );
      setPosts((current) =>
        current.map((post) =>
          post.author.id === profile.id
            ? {
                ...post,
                author: { ...post.author, isFollowing: nextFollowing },
              }
            : post,
        ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update follow.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function toggleReaction(item: PublicActivityItem) {
    setError(null);
    setSuccess(null);
    setActivityBusyId(`reaction:${item.id}`);
    try {
      const response = await fetch("/api/activity-reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: item.id }),
      });
      const payload = (await response.json()) as {
        reacted?: boolean;
        reactionCount?: number;
        error?: string;
      };

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not update reaction.");
      }

      setFeedItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                viewerReacted: Boolean(payload.reacted),
                reactionCount: payload.reactionCount ?? candidate.reactionCount,
              }
            : candidate,
        ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update reaction.",
      );
    } finally {
      setActivityBusyId(null);
    }
  }

  async function submitComment(item: PublicActivityItem) {
    const commentBody = (commentTextById[item.id] ?? "").trim();
    if (!commentBody) {
      return;
    }

    setError(null);
    setSuccess(null);
    setActivityBusyId(`comment:${item.id}`);
    try {
      const response = await fetch("/api/activity-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: item.id, body: commentBody }),
      });
      const payload = (await response.json()) as {
        comment?: PublicActivityItem["comments"][number];
        error?: string;
      };

      if (!response.ok || payload.error || !payload.comment) {
        throw new Error(payload.error ?? "Could not post comment.");
      }
      const comment = payload.comment;

      setFeedItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                comments: [...candidate.comments, comment],
              }
            : candidate,
        ),
      );
      setCommentTextById((current) => ({ ...current, [item.id]: "" }));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not post comment.",
      );
    } finally {
      setActivityBusyId(null);
    }
  }

  async function reportActivity(item: PublicActivityItem) {
    const reason = window.prompt("What should moderators review?");
    if (!reason?.trim()) {
      return;
    }

    setError(null);
    setSuccess(null);
    setActivityBusyId(`report:${item.id}`);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "activity",
          reportedUserId: item.playerId,
          activityId: item.id,
          gameSlug: item.gameSlug,
          reason,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not send report.");
      }
      setSuccess("Thanks. Moderators can review that activity.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not send report.",
      );
    } finally {
      setActivityBusyId(null);
    }
  }

  async function blockProfile(profileId: string) {
    setError(null);
    setSuccess(null);
    setBusyId(`block:${profileId}`);
    try {
      const response = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedUserId: profileId }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not block player.");
      }

      setItems((current) =>
        current.filter((candidate) => candidate.id !== profileId),
      );
      setFeedItems((current) =>
        current.filter((item) => item.playerId !== profileId),
      );
      setPosts((current) =>
        current.filter((post) => post.author.id !== profileId),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not block player.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function reportProfile(profile: PublicProfile) {
    const reason = window.prompt(
      "What should moderators review about this profile?",
    );
    if (!reason?.trim()) {
      return;
    }

    setError(null);
    setSuccess(null);
    setBusyId(`report:${profile.id}`);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "profile",
          reportedUserId: profile.id,
          reason,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not send report.");
      }
      setSuccess("Thanks. Moderators can review that profile.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not send report.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="-mx-4 space-y-4 sm:mx-0 sm:space-y-6">
      <div className="overflow-hidden border-y bg-[radial-gradient(circle_at_top_left,rgba(53,208,127,0.16),transparent_34%),linear-gradient(135deg,#15191d,#232b33)] px-4 py-5 shadow-sm sm:rounded-xl sm:border sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-cyan-200">Community Hub</p>
            <h1 className="mt-1 text-2xl font-black leading-tight tracking-normal text-zinc-50 sm:text-4xl">
              Talk games with people who actually play them
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base">
              Post what you are playing, ask for recommendations, attach games,
              react to other players, and follow people whose taste you trust.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-sm lg:min-w-[420px]">
            <CommunityStat label="Posts" value={liveStats.postCount} />
            <CommunityStat
              label="Following"
              value={liveStats.followingPostCount}
            />
            <CommunityStat label="Game posts" value={liveStats.gamePostCount} />
            <CommunityStat label="Players" value={liveStats.playerCount} />
          </div>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-100"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          role="status"
          className="rounded-md border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100"
        >
          {success}
        </p>
      ) : null}
      {unavailable ? (
        <p
          role="status"
          className="rounded-md border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm text-amber-100"
        >
          Community posts are waiting on the latest Supabase migration.
        </p>
      ) : null}

      <MobilePeopleStrip
        profiles={items}
        busyId={busyId}
        onFollow={toggleFollow}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 space-y-3 sm:space-y-4">
          <article className="overflow-hidden border-y bg-panel sm:rounded-xl sm:border">
            <div className="p-4 sm:p-5">
              <div className="flex gap-3">
                <CommunityAvatar
                  src={currentProfile?.avatarUrl}
                  name={currentProfile?.displayName ?? "Your profile"}
                  className="h-10 w-10 sm:h-12 sm:w-12"
                />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="community-post-body"
                    className="text-sm font-semibold"
                  >
                    Create a post
                  </label>
                  <textarea
                    id="community-post-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    maxLength={1200}
                    placeholder="What's on your mind about games?"
                    className="mt-2 min-h-24 w-full resize-none rounded-xl border bg-zinc-950 px-3 py-3 text-sm leading-6 outline-none transition focus:border-cyan-300 sm:min-h-28 sm:resize-y"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-sm font-semibold">
                  Mood
                  <select
                    value={mood}
                    onChange={(event) =>
                      setMood(event.target.value as CommunityPostMood)
                    }
                    className="mt-2 h-10 w-full rounded-md border bg-zinc-950 px-3 text-sm outline-none focus:border-cyan-300"
                  >
                    {COMMUNITY_POST_MOODS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Visibility
                  <select
                    value={visibility}
                    onChange={(event) =>
                      setVisibility(
                        event.target.value as CommunityPostVisibility,
                      )
                    }
                    className="mt-2 h-10 w-full rounded-md border bg-zinc-950 px-3 text-sm outline-none focus:border-cyan-300"
                  >
                    {COMMUNITY_POST_VISIBILITIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Optional image URL
                  <input
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    placeholder="https://..."
                    className="mt-2 h-10 w-full rounded-md border bg-zinc-950 px-3 text-sm outline-none focus:border-cyan-300"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-lg border bg-zinc-950/35 p-3">
                <label
                  htmlFor="community-game-search"
                  className="text-sm font-semibold"
                >
                  Attach a game
                </label>
                {selectedGame ? (
                  <div className="mt-3 flex items-center gap-3 rounded-lg border bg-zinc-950 p-2">
                    <GameArtwork
                      src={selectedGame.coverImageUrl}
                      alt={`${selectedGame.title} cover`}
                      className="h-16 w-12 shrink-0 rounded-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {selectedGame.title}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        {selectedGame.genres.slice(0, 2).join(", ") ||
                          "Game attachment"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedGame(null);
                        setGameQuery("");
                      }}
                      aria-label={`Remove ${selectedGame.title} attachment`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative mt-2">
                    <Search
                      className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-500"
                      aria-hidden
                    />
                    <input
                      id="community-game-search"
                      value={gameQuery}
                      onChange={(event) => setGameQuery(event.target.value)}
                      placeholder="Search a game to attach..."
                      className="h-11 w-full rounded-md border bg-zinc-950 pl-9 pr-3 text-sm outline-none focus:border-cyan-300"
                    />
                    {isSearchingGames ? (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-zinc-400" />
                    ) : null}
                  </div>
                )}

                {!selectedGame &&
                gameQuery.trim().length >= 2 &&
                gameResults.length ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {gameResults.map((game) => (
                      <button
                        key={game.slug}
                        type="button"
                        onClick={() => {
                          setSelectedGame(game);
                          setGameQuery(game.title);
                        }}
                        className="flex min-w-0 items-center gap-2 rounded-md border bg-zinc-950 p-2 text-left transition hover:border-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                      >
                        <GameArtwork
                          src={game.coverImageUrl}
                          alt={`${game.title} cover`}
                          className="h-12 w-9 shrink-0 rounded-sm"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {game.title}
                          </span>
                          <span className="block truncate text-xs text-zinc-500">
                            {game.releaseDate?.slice(0, 4) ?? "Unknown year"}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-500">
                  {1200 - body.length} characters left
                </p>
                <Button
                  type="button"
                  disabled={!body.trim() || postBusyId === "create-post"}
                  onClick={publishPost}
                  className="w-full sm:w-auto"
                >
                  {postBusyId === "create-post" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Publish post
                </Button>
              </div>
            </div>
          </article>

          <div className="sticky top-16 z-20 border-y bg-background/95 px-4 py-2 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
            <div className="scrollbar-hidden flex min-w-0 gap-2 overflow-x-auto pb-1">
              <FeedTab
                active={feedMode === "for-you"}
                label="For you"
                icon={<Sparkles className="h-4 w-4" />}
                onClick={() => setFeedMode("for-you")}
              />
              <FeedTab
                active={feedMode === "following"}
                label="Following"
                icon={<Users className="h-4 w-4" />}
                onClick={() => setFeedMode("following")}
              />
              <FeedTab
                active={feedMode === "games"}
                label="Game talk"
                icon={<Gamepad2 className="h-4 w-4" />}
                onClick={() => setFeedMode("games")}
              />
              <FeedTab
                active={feedMode === "saved"}
                label="Saved"
                icon={<Bookmark className="h-4 w-4" />}
                onClick={() => setFeedMode("saved")}
              />
            </div>
          </div>

          {visiblePosts.length ? (
            <div className="space-y-4">
              {visiblePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  busyId={postBusyId}
                  commentText={postCommentTextById[post.id] ?? ""}
                  onCommentTextChange={(value) =>
                    setPostCommentTextById((current) => ({
                      ...current,
                      [post.id]: value,
                    }))
                  }
                  onReact={(reaction) => reactToPost(post, reaction)}
                  onComment={() => submitPostComment(post)}
                  onBookmark={() => togglePostBookmark(post)}
                  onShare={() => sharePost(post)}
                  onReport={() => reportPost(post)}
                  onDelete={() => deletePost(post)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-panel p-8 text-center">
              <MessageSquareText className="mx-auto h-9 w-9 text-cyan-200" />
              <h2 className="mt-4 text-xl font-bold">No posts here yet.</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
                Try another feed tab or write the first post. Game communities
                get interesting when someone asks a real question.
              </p>
            </div>
          )}
        </main>

        <aside className="hidden space-y-4 xl:sticky xl:top-24 xl:block xl:self-start">
          <section className="rounded-xl border bg-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Players to follow</h2>
              <Button asChild variant="secondary" size="sm">
                <Link href="/search">Find games</Link>
              </Button>
            </div>

            {items.length ? (
              <div className="mt-4 space-y-3">
                {items.slice(0, 6).map((profile) => (
                  <article key={profile.id} className="rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <CommunityAvatar
                        src={profile.avatarUrl}
                        name={profile.displayName}
                        className="h-11 w-11"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/players/${profile.id}`}
                          className="block truncate font-semibold hover:text-cyan-200"
                        >
                          {profile.displayName}
                        </Link>
                        <p className="text-xs text-zinc-400">
                          {profile.followersCount} followers
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/players/${profile.id}`}>Profile</Link>
                      </Button>
                      <Button
                        type="button"
                        variant={profile.isFollowing ? "secondary" : "default"}
                        size="sm"
                        disabled={
                          profile.isCurrentUser || busyId === profile.id
                        }
                        onClick={() => toggleFollow(profile)}
                      >
                        {busyId === profile.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : profile.isFollowing ? (
                          <UserRoundCheck className="h-4 w-4" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                        {profile.isCurrentUser
                          ? "You"
                          : profile.isFollowing
                            ? "Following"
                            : "Follow"}
                      </Button>
                    </div>
                    {!profile.isCurrentUser ? (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busyId === `report:${profile.id}`}
                          onClick={() => reportProfile(profile)}
                        >
                          <ShieldAlert className="h-4 w-4" />
                          Report
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busyId === `block:${profile.id}`}
                          onClick={() => blockProfile(profile.id)}
                        >
                          <Ban className="h-4 w-4" />
                          Block
                        </Button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border bg-zinc-950/35 p-4 text-sm text-zinc-400">
                Public players will appear here as the community grows.
              </p>
            )}
          </section>

          <section className="rounded-xl border bg-panel p-4">
            <h2 className="text-lg font-bold">Recent library activity</h2>
            {feedItems.length ? (
              <div className="mt-4 space-y-3">
                {feedItems.slice(0, 5).map((item) => (
                  <article key={item.id} className="rounded-lg border p-3">
                    <div className="flex gap-3">
                      <GameArtwork
                        src={item.gameCoverImageUrl}
                        alt={`${item.gameTitle} cover`}
                        className="h-16 w-11 shrink-0 rounded-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-5 text-zinc-300">
                          <Link
                            href={`/players/${item.playerId}`}
                            className="font-semibold text-zinc-100 hover:text-cyan-200"
                          >
                            {item.playerName}
                          </Link>{" "}
                          {activityText(item)}{" "}
                          <Link
                            href={`/games/${item.gameSlug}`}
                            className="font-semibold text-zinc-100 hover:text-cyan-200"
                          >
                            {item.gameTitle}
                          </Link>
                          .
                        </p>
                        {item.activityType === "rating_saved" ? (
                          <RatingDetails
                            rating={item}
                            compact
                            className="mt-3"
                          />
                        ) : null}
                        <p className="mt-2 text-xs text-zinc-500">
                          {formatCompactDate(item.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                      <Button
                        type="button"
                        variant={item.viewerReacted ? "default" : "outline"}
                        size="sm"
                        disabled={activityBusyId === `reaction:${item.id}`}
                        onClick={() => toggleReaction(item)}
                        aria-pressed={item.viewerReacted}
                      >
                        {activityBusyId === `reaction:${item.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Heart
                            className={
                              item.viewerReacted
                                ? "h-4 w-4 fill-zinc-950"
                                : "h-4 w-4"
                            }
                          />
                        )}
                        {item.reactionCount}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={activityBusyId === `report:${item.id}`}
                        onClick={() => reportActivity(item)}
                      >
                        <ShieldAlert className="h-4 w-4" />
                        Report
                      </Button>
                    </div>

                    {item.comments.length ? (
                      <ul className="mt-3 space-y-2">
                        {item.comments.map((comment) => (
                          <li
                            key={comment.id}
                            className="rounded-md border bg-zinc-950/40 p-2 text-sm"
                          >
                            <Link
                              href={`/players/${comment.playerId}`}
                              className="font-semibold hover:text-cyan-200"
                            >
                              {comment.playerName}
                            </Link>{" "}
                            <span className="text-zinc-300">
                              {comment.body}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <form
                      className="mt-3 flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void submitComment(item);
                      }}
                    >
                      <label className="sr-only" htmlFor={`comment-${item.id}`}>
                        Comment on {item.gameTitle}
                      </label>
                      <input
                        id={`comment-${item.id}`}
                        value={commentTextById[item.id] ?? ""}
                        onChange={(event) =>
                          setCommentTextById((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        maxLength={400}
                        placeholder="Write a quick comment..."
                        className="h-10 min-w-0 flex-1 rounded-md border bg-zinc-950 px-3 text-sm outline-none focus:border-cyan-300"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={
                          activityBusyId === `comment:${item.id}` ||
                          !(commentTextById[item.id] ?? "").trim()
                        }
                        aria-label={`Post comment on ${item.gameTitle}`}
                      >
                        {activityBusyId === `comment:${item.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border bg-zinc-950/35 p-4 text-sm text-zinc-400">
                Rate a game or update your library to create public activity.
              </p>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}

function MobilePeopleStrip({
  profiles,
  busyId,
  onFollow,
}: {
  profiles: PublicProfile[];
  busyId: string | null;
  onFollow: (profile: PublicProfile) => void;
}) {
  if (!profiles.length) {
    return null;
  }

  return (
    <section className="xl:hidden">
      <div className="mb-2 flex items-center justify-between px-4">
        <h2 className="text-sm font-bold text-zinc-100">Players to follow</h2>
        <Link href="/search" className="text-xs font-semibold text-cyan-200">
          Find games
        </Link>
      </div>
      <div className="scrollbar-hidden flex gap-3 overflow-x-auto px-4 pb-1">
        {profiles.slice(0, 8).map((profile) => (
          <article
            key={profile.id}
            className="w-36 shrink-0 rounded-xl border bg-panel p-3 text-center"
          >
            <CommunityAvatar
              src={profile.avatarUrl}
              name={profile.displayName}
              className="mx-auto h-14 w-14"
            />
            <Link
              href={`/players/${profile.id}`}
              className="mt-3 block truncate text-sm font-bold hover:text-cyan-200"
            >
              {profile.displayName}
            </Link>
            <p className="mt-1 text-xs text-zinc-500">
              {profile.followersCount} followers
            </p>
            <Button
              type="button"
              variant={profile.isFollowing ? "secondary" : "default"}
              size="sm"
              disabled={profile.isCurrentUser || busyId === profile.id}
              onClick={() => onFollow(profile)}
              className="mt-3 w-full px-2"
            >
              {busyId === profile.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : profile.isFollowing ? (
                <UserRoundCheck className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {profile.isCurrentUser
                ? "You"
                : profile.isFollowing
                  ? "Following"
                  : "Follow"}
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}

function PostCard({
  post,
  busyId,
  commentText,
  onCommentTextChange,
  onReact,
  onComment,
  onBookmark,
  onShare,
  onReport,
  onDelete,
}: {
  post: CommunityPost;
  busyId: string | null;
  commentText: string;
  onCommentTextChange: (value: string) => void;
  onReact: (reaction: CommunityPostReactionType) => void;
  onComment: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onReport: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      id={`post-${post.id}`}
      className="border-y bg-panel p-4 transition duration-200 hover:border-cyan-300/60 sm:rounded-xl sm:border sm:p-5"
    >
      <header className="flex min-w-0 items-start gap-3">
        <CommunityAvatar
          src={post.author.avatarUrl}
          name={post.author.displayName}
          className="h-10 w-10 sm:h-12 sm:w-12"
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={`/players/${post.author.id}`}
              className="min-w-0 truncate font-semibold hover:text-cyan-200"
            >
              {post.author.displayName}
            </Link>
            <span className="shrink-0 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-xs text-cyan-100">
              {moodLabel(post.mood)}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
            <span>{formatCompactDate(post.createdAt)}</span>
            <span aria-hidden>·</span>
            {post.visibility === "public" ? (
              <Globe2 className="h-3 w-3" aria-label="Public post" />
            ) : (
              <Users className="h-3 w-3" aria-label="Followers-only post" />
            )}
          </p>
        </div>
        {post.author.isCurrentUser ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={busyId === `delete:${post.id}`}
            onClick={onDelete}
            aria-label="Delete post"
          >
            {busyId === `delete:${post.id}` ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        ) : null}
      </header>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-200 sm:text-base">
        {post.body}
      </p>

      {post.game ? (
        <Link
          href={`/games/${post.game.slug}`}
          className="mt-4 grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-xl border bg-zinc-950/45 p-3 transition hover:border-cyan-300 sm:grid-cols-[84px_1fr]"
        >
          <GameArtwork
            src={post.game.coverImageUrl}
            alt={`${post.game.title} cover`}
            className="h-24 w-[72px] rounded-md sm:h-32 sm:w-20"
          />
          <span className="min-w-0">
            <span className="block truncate text-base font-bold sm:text-lg">
              {post.game.title}
            </span>
            <span className="mt-1 line-clamp-2 block text-sm leading-6 text-zinc-400">
              {post.game.description}
            </span>
            <span className="mt-3 flex min-w-0 flex-wrap gap-2">
              {post.game.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="rounded-md border px-2 py-1 text-xs text-zinc-300"
                >
                  {genre}
                </span>
              ))}
              {post.game.externalRating ? (
                <span className="rounded-md border border-lime-300/40 bg-lime-300/10 px-2 py-1 text-xs font-semibold text-lime-100">
                  {post.game.externalRating.toFixed(1)}
                </span>
              ) : null}
            </span>
          </span>
        </Link>
      ) : null}

      {post.imageUrl ? (
        <div className="mt-4 overflow-hidden rounded-lg border bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt="Community post attachment"
            className="max-h-[520px] w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3 text-xs text-zinc-400">
        <span className="min-w-0 truncate">
          {post.reactionTotal} reactions · {post.commentCount} comments
        </span>
        {post.viewerBookmarked ? (
          <span className="shrink-0 text-cyan-200">Saved</span>
        ) : null}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5 border-y py-2 sm:gap-2">
        {COMMUNITY_POST_REACTIONS.map((reaction) => {
          const pressed = post.viewerReaction === reaction.type;
          const reactionBusy =
            busyId === `reaction:${post.id}:${reaction.type}`;
          return (
            <Button
              key={reaction.type}
              type="button"
              variant={pressed ? "default" : "ghost"}
              size="sm"
              disabled={reactionBusy}
              onClick={() => onReact(reaction.type)}
              aria-pressed={pressed}
              title={`${reaction.label}: ${post.reactionCounts[reaction.type]}`}
              className="min-w-0 px-1 text-[11px] sm:px-3 sm:text-xs"
            >
              {reactionBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : reaction.type === "backlog" ? (
                <Bookmark
                  className={pressed ? "h-4 w-4 fill-zinc-950" : "h-4 w-4"}
                />
              ) : reaction.type === "hype" ? (
                <Sparkles className="h-4 w-4" />
              ) : reaction.type === "played_it" ? (
                <Gamepad2 className="h-4 w-4" />
              ) : (
                <Heart
                  className={pressed ? "h-4 w-4 fill-zinc-950" : "h-4 w-4"}
                />
              )}
              {reaction.label}
              <span className="text-[10px] opacity-80 sm:text-xs">
                {post.reactionCounts[reaction.type]}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
        <Button
          type="button"
          variant={post.viewerBookmarked ? "secondary" : "ghost"}
          size="sm"
          disabled={busyId === `bookmark:${post.id}`}
          onClick={onBookmark}
          aria-pressed={post.viewerBookmarked}
          className="px-2"
        >
          {busyId === `bookmark:${post.id}` ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bookmark
              className={
                post.viewerBookmarked ? "h-4 w-4 fill-zinc-100" : "h-4 w-4"
              }
            />
          )}
          {post.viewerBookmarked ? "Saved" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="px-2"
        >
          <Clipboard className="h-4 w-4" />
          Share
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busyId === `report:${post.id}`}
          onClick={onReport}
          className="px-2"
        >
          {busyId === `report:${post.id}` ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldAlert className="h-4 w-4" />
          )}
          Report
        </Button>
      </div>

      {post.comments.length ? (
        <ul className="mt-4 space-y-2">
          {post.comments.map((comment) => (
            <li key={comment.id} className="flex gap-2 rounded-lg border p-3">
              <CommunityAvatar
                src={comment.author.avatarUrl}
                name={comment.author.displayName}
                className="h-9 w-9"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/players/${comment.author.id}`}
                    className="text-sm font-semibold hover:text-cyan-200"
                  >
                    {comment.author.displayName}
                  </Link>
                  <span className="text-xs text-zinc-500">
                    {formatCompactDate(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                  {comment.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        className="mt-4 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onComment();
        }}
      >
        <label className="sr-only" htmlFor={`post-comment-${post.id}`}>
          Comment on this post
        </label>
        <input
          id={`post-comment-${post.id}`}
          value={commentText}
          onChange={(event) => onCommentTextChange(event.target.value)}
          maxLength={500}
          placeholder="Write a comment..."
          className="h-11 min-w-0 flex-1 rounded-full border bg-zinc-950 px-4 text-sm outline-none focus:border-cyan-300"
        />
        <Button
          type="submit"
          size="icon"
          disabled={busyId === `comment:${post.id}` || !commentText.trim()}
          aria-label="Post comment"
        >
          {busyId === `comment:${post.id}` ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </article>
  );
}

function FeedTab({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
        active
          ? "border-cyan-300 bg-cyan-300 text-zinc-950"
          : "bg-panel text-zinc-200 hover:border-cyan-300"
      }`}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}

function CommunityStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-lg border bg-zinc-950/35 p-2 sm:p-3">
      <p className="text-xl font-bold sm:text-2xl">{value}</p>
      <p className="mt-1 truncate text-[11px] leading-tight text-zinc-400 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function activityText(item: PublicActivityItem) {
  if (item.activityType === "rating_saved") {
    return item.overallRating ? `rated ${item.overallRating}/10 for` : "rated";
  }

  if (item.activityType === "favorite_changed") {
    return item.isFavorite ? "favorited" : "removed a favorite from";
  }

  if (item.status === "played") {
    return "marked as played";
  }

  if (item.status === "playing") {
    return "started playing";
  }

  if (item.status === "want_to_play") {
    return "added to the backlog";
  }

  if (item.status === "dropped") {
    return "dropped";
  }

  if (item.status === "not_interested") {
    return "passed on";
  }

  return "updated";
}

function moodLabel(mood: CommunityPostMood) {
  return (
    COMMUNITY_POST_MOODS.find((candidate) => candidate.value === mood)?.label ??
    "Discussion"
  );
}

function CommunityAvatar({
  src,
  name,
  className = "h-14 w-14",
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} avatar`}
        className={`${className} shrink-0 rounded-md border object-cover`}
      />
    );
  }

  return (
    <span
      className={`${className} inline-flex shrink-0 items-center justify-center rounded-md border bg-zinc-900 text-zinc-400`}
      role="img"
      aria-label={`${name} avatar placeholder`}
    >
      <UserRound className="h-5 w-5" aria-hidden />
    </span>
  );
}
