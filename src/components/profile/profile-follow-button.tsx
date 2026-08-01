"use client";

import { Loader2, UserPlus, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ProfileFollowButton({
  profileId,
  initialFollowing,
  initialFollowers,
}: {
  profileId: string;
  initialFollowing: boolean;
  initialFollowers: number;
}) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(initialFollowers);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleFollow() {
    setBusy(true);
    setError(null);
    const nextFollowing = !isFollowing;

    try {
      const response = await fetch("/api/follows", {
        method: nextFollowing ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: profileId }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not update follow.");
      }

      setIsFollowing(nextFollowing);
      setFollowers((current) =>
        Math.max(0, current + (nextFollowing ? 1 : -1)),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update follow.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={isFollowing ? "secondary" : "default"}
        onClick={toggleFollow}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : isFollowing ? (
          <UserRoundCheck className="h-4 w-4" aria-hidden />
        ) : (
          <UserPlus className="h-4 w-4" aria-hidden />
        )}
        {isFollowing ? "Following" : "Follow"}
      </Button>
      <p className="text-xs text-zinc-500" aria-live="polite">
        {followers} follower{followers === 1 ? "" : "s"}
      </p>
      {error ? (
        <p role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
