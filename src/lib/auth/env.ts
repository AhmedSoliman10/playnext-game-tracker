export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8000";
export const OAUTH_NEXT_COOKIE = "playnext_oauth_next";

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return "http://localhost:8000";
  }
}

function isLocalOrigin(origin: string) {
  const { hostname } = new URL(origin);
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isTrustedVercelOrigin(origin: string) {
  return new URL(origin).hostname.endsWith(".vercel.app");
}

export function getAppOrigin(request?: Request) {
  const configuredOrigin = normalizeOrigin(APP_URL);
  if (!request) {
    return configuredOrigin;
  }

  const requestOrigin = normalizeOrigin(request.url);
  if (
    requestOrigin === configuredOrigin ||
    isLocalOrigin(requestOrigin) ||
    (isLocalOrigin(configuredOrigin) && isTrustedVercelOrigin(requestOrigin))
  ) {
    return requestOrigin;
  }

  return configuredOrigin;
}

export function getAuthCallbackUrl(request: Request, next?: string | null) {
  const callbackUrl = new URL("/auth/callback", getAppOrigin(request));
  if (next) {
    callbackUrl.searchParams.set("next", next);
  }
  return callbackUrl.toString();
}

export function getAuthConfirmUrl(request: Request, next = "/dashboard") {
  const callbackUrl = new URL("/auth/confirm", getAppOrigin(request));
  callbackUrl.searchParams.set("next", next);
  return callbackUrl.toString();
}

export function getAuthConfirmFlowUrl(
  request: Request,
  flow: "signup" | "reset",
) {
  return new URL(`/auth/confirm/${flow}`, getAppOrigin(request)).toString();
}

export function getSafeNextPath(value: string | null, fallback = "/dashboard") {
  if (!value || !value.startsWith("/")) {
    return fallback;
  }

  if (value.startsWith("//")) {
    return fallback;
  }

  return value;
}

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
