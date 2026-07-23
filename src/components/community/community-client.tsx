"use client";

import { Loader2, UserPlus, UserRound, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PublicProfile } from "@/lib/types";

export function CommunityClient({
  profiles,
  unavailable = false,
}: {
  profiles: PublicProfile[];
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
          Follow other players so recommendations and shared activity can grow
          around real taste over time.
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

      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  <h2 className="truncate text-lg font-bold">
                    {profile.displayName}
                  </h2>
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
        <div className="rounded-lg border bg-panel p-8 text-center">
          <h2 className="text-xl font-bold">No players to show yet.</h2>
          <p className="mt-2 text-zinc-400">
            Once accounts are created, they will appear here for following.
          </p>
        </div>
      )}
    </section>
  );
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
