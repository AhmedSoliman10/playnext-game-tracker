import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { DiscordProfile } from "@/lib/types";

type DiscordProfileUpdate = {
  discord_user_id?: string | null;
  discord_username?: string | null;
  discord_avatar_url?: string | null;
  discord_connected_at?: string | null;
};

export function getDiscordProfileFromUser(user: User): DiscordProfile | null {
  const identity = user.identities?.find(
    (candidate) => candidate.provider === "discord",
  );
  if (!identity) {
    return null;
  }

  const identityData = asRecord(identity.identity_data);
  const metadata = asRecord(user.user_metadata);
  const username =
    stringValue(identityData?.user_name) ??
    stringValue(identityData?.preferred_username) ??
    stringValue(identityData?.name) ??
    stringValue(metadata?.user_name) ??
    stringValue(metadata?.preferred_username) ??
    stringValue(metadata?.name);
  const avatarUrl =
    stringValue(identityData?.avatar_url) ?? stringValue(metadata?.avatar_url);

  return {
    connected: true,
    userId: identity.id,
    username,
    avatarUrl,
    connectedAt: identity.created_at ?? null,
  };
}

export function mapDiscordProfileRow(row: {
  discord_user_id?: string | null;
  discord_username?: string | null;
  discord_avatar_url?: string | null;
  discord_connected_at?: string | null;
}): DiscordProfile | null {
  if (!row.discord_user_id && !row.discord_username) {
    return null;
  }

  return {
    connected: true,
    userId: row.discord_user_id ?? null,
    username: row.discord_username ?? null,
    avatarUrl: row.discord_avatar_url ?? null,
    connectedAt: row.discord_connected_at ?? null,
  };
}

export async function syncDiscordProfileToProfile(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
  discord: DiscordProfile | null,
) {
  if (!discord?.connected) {
    return;
  }

  const update: DiscordProfileUpdate = {
    discord_user_id: discord.userId ?? null,
    discord_username: discord.username ?? null,
    discord_avatar_url: discord.avatarUrl ?? null,
    discord_connected_at: discord.connectedAt ?? new Date().toISOString(),
  };

  await supabase.from("profiles").update(update).eq("id", userId);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
