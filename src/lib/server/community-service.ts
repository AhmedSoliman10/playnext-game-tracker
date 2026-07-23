import { isSupabaseConfigured } from "@/lib/auth/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicProfile, UserContext } from "@/lib/types";
import type { FollowInput } from "@/lib/validation/community";

export async function getCommunityProfiles(
  user: UserContext,
): Promise<PublicProfile[]> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return [
      {
        id: user.userId,
        displayName: user.displayName ?? "Demo player",
        avatarUrl: user.avatarUrl ?? null,
        createdAt: new Date().toISOString(),
        followersCount: 0,
        followingCount: 0,
        isFollowing: false,
        isCurrentUser: true,
      },
    ];
  }

  const supabase = await createSupabaseServerClient();
  const { data: profiles, error: profilesError } = await supabase!
    .from("profiles")
    .select("id, display_name, avatar_url, created_at")
    .order("created_at", { ascending: false })
    .limit(48);

  if (profilesError) {
    throw new Error("Could not load community profiles.");
  }

  const { data: follows, error: followsError } = await supabase!
    .from("follows")
    .select("follower_id, following_id");

  if (followsError) {
    throw new Error("Could not load follows.");
  }

  const followerCounts = new Map<string, number>();
  const followingCounts = new Map<string, number>();
  const viewerFollows = new Set<string>();

  for (const follow of follows ?? []) {
    followerCounts.set(
      follow.following_id,
      (followerCounts.get(follow.following_id) ?? 0) + 1,
    );
    followingCounts.set(
      follow.follower_id,
      (followingCounts.get(follow.follower_id) ?? 0) + 1,
    );

    if (follow.follower_id === user.userId) {
      viewerFollows.add(follow.following_id);
    }
  }

  return (profiles ?? []).map((profile) => ({
    id: profile.id,
    displayName: profile.display_name ?? "Player",
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    followersCount: followerCounts.get(profile.id) ?? 0,
    followingCount: followingCounts.get(profile.id) ?? 0,
    isFollowing: viewerFollows.has(profile.id),
    isCurrentUser: profile.id === user.userId,
  }));
}

export async function followPlayer(user: UserContext, input: FollowInput) {
  if (user.userId === input.followingId) {
    throw new Error("You cannot follow yourself.");
  }

  if (user.isDemo || !isSupabaseConfigured()) {
    throw new Error("Community follows need Supabase authentication.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase!.from("follows").upsert(
    {
      follower_id: user.userId,
      following_id: input.followingId,
    },
    { onConflict: "follower_id,following_id" },
  );

  if (error) {
    throw new Error("Could not follow that player.");
  }
}

export async function unfollowPlayer(user: UserContext, input: FollowInput) {
  if (user.isDemo || !isSupabaseConfigured()) {
    throw new Error("Community follows need Supabase authentication.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase!
    .from("follows")
    .delete()
    .eq("follower_id", user.userId)
    .eq("following_id", input.followingId);

  if (error) {
    throw new Error("Could not unfollow that player.");
  }
}
