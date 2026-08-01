export type DiscordAuthErrorReason =
  | "already-linked"
  | "manual-linking-disabled"
  | "missing-code"
  | "provider-disabled"
  | "redirect-url"
  | "signed-out"
  | "supabase"
  | "discord";

export function getDiscordAuthErrorReason(value: string) {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("identity_already_exists") ||
    normalized.includes("already registered") ||
    normalized.includes("already linked") ||
    normalized.includes("already exists") ||
    (normalized.includes("identity") && normalized.includes("exists"))
  ) {
    return "already-linked";
  }

  if (
    normalized.includes("manual") &&
    normalized.includes("link") &&
    (normalized.includes("disabled") || normalized.includes("enable"))
  ) {
    return "manual-linking-disabled";
  }

  if (
    normalized.includes("identity linking") &&
    (normalized.includes("disabled") || normalized.includes("enable"))
  ) {
    return "manual-linking-disabled";
  }

  if (
    normalized.includes("redirect") &&
    (normalized.includes("not allowed") ||
      normalized.includes("invalid") ||
      normalized.includes("uri"))
  ) {
    return "redirect-url";
  }

  if (
    normalized.includes("provider") &&
    (normalized.includes("disabled") || normalized.includes("not enabled"))
  ) {
    return "provider-disabled";
  }

  if (
    normalized.includes("session") &&
    (normalized.includes("missing") || normalized.includes("not found"))
  ) {
    return "signed-out";
  }

  return "discord";
}
