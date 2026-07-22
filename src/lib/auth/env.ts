export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8000";

export function isSupabaseConfigured() {
  if (process.env.PLAYNEXT_FORCE_DEMO === "true") {
    return false;
  }

  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isSupabaseAdminConfigured() {
  return Boolean(
    isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
