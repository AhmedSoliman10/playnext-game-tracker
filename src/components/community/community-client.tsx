"use client";

import {
  Loader2,
  MessageSquareText,
  UserPlus,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { GameArtwork } from "@/components/games/game-artwork";
import { Button } from "@/components/ui/button";
import type { PublicActivityItem, PublicProfile } from "@/lib/types";
import { formatCompactDate } from "@/lib/utils";

export function CommunityClient({
  profiles,
  activity,
  unavailable = false,
}: {
  profiles: PublicProfile[];
  activity: PublicActivityItem[];
  unavailable?: boolean;
}) {
  const [items, setItems] = useState(profiles);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleFollow(profile: PublicProfile) {
    setError(null);
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

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-cyan-200">Community</p>
        <h1 className="text-3xl font-bold">Players on PlayNext</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Browse public profiles, follow players with similar taste, and see
          what the community is playing and rating.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-100"
        >
          {error}
        </p>
      ) : null}
      {unavailable ? (
        <p
          role="status"
          className="rounded-md border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm text-amber-100"
        >
          Community data is waiting on the latest Supabase migration.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Public Activity</h2>
            <Button asChild variant="secondary" size="sm">
              <Link href="/discover">Open discovery</Link>
            </Button>
          </div>

          {activity.length ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <article
                  key={item.id}
                  className="flex gap-3 rounded-lg border bg-panel p-3 transition duration-200 hover:border-cyan-300/70"
                >
                  <GameArtwork
                    src={item.gameCoverImageUrl}
                    alt={`${item.gameTitle} cover`}
                    className="h-24 w-16 shrink-0 rounded-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-6 text-zinc-300">
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
                    <p className="mt-2 text-xs text-zinc-500">
                      {formatCompactDate(item.createdAt)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-panel p-6">
              <MessageSquareText className="h-8 w-8 text-cyan-200" />
              <h3 className="mt-4 text-lg font-bold">
                No public activity yet.
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Rate a game, favorite a title, or update your library to start
                the feed.
              </p>
              <Button asChild className="mt-5">
                <Link href="/discover">Answer a game card</Link>
              </Button>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Players</h2>
          {items.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((profile) => (
                <article
                  key={profile.id}
                  className="rounded-lg border bg-panel p-4 transition duration-200 hover:-translate-y-1 hover:border-cyan-300/70 motion-reduce:hover:translate-y-0"
                >
                  <div className="flex items-center gap-3">
                    <CommunityAvatar
                      src={profile.avatarUrl}
                      name={profile.displayName}
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold">
                        {profile.displayName}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        {profile.followersCount} followers ·{" "}
                        {profile.followingCount} following
                      </p>
                    </div>
                  </div>

                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href={`/players/${profile.id}`}>View profile</Link>
                  </Button>

                  <Button
                    type="button"
                    variant={profile.isFollowing ? "secondary" : "default"}
                    className="mt-4 w-full"
                    disabled={profile.isCurrentUser || busyId === profile.id}
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
                      ? "This is you"
                      : profile.isFollowing
                        ? "Following"
                        : "Follow"}
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-panel p-6">
              <UserRound className="h-8 w-8 text-cyan-200" />
              <h3 className="mt-4 text-lg font-bold">
                No players to show yet.
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                New public accounts will appear here. Your own profile is
                visible when it is not set to private.
              </p>
              <Button asChild variant="secondary" className="mt-5">
                <Link href="/settings">Review privacy settings</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </section>
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

function CommunityAvatar({ src, name }: { src?: string | null; name: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} avatar`}
        className="h-14 w-14 rounded-md border object-cover"
      />
    );
  }

  return (
    <span className="inline-flex h-14 w-14 items-center justify-center rounded-md border bg-zinc-900 text-zinc-400">
      <UserRound className="h-6 w-6" aria-hidden />
    </span>
  );
}
