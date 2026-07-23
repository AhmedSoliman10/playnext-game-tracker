import type { UserContext } from "@/lib/types";

export const DEMO_SESSION_COOKIE = "playnext_demo_user";

export function createDemoUser(
  email: string,
  displayName?: string | null,
  avatarUrl?: string | null,
): UserContext {
  const normalizedEmail = email.trim().toLowerCase();
  return {
    userId: `demo:${normalizedEmail}`,
    email: normalizedEmail,
    displayName:
      displayName?.trim() || normalizedEmail.split("@")[0] || "Demo player",
    avatarUrl: avatarUrl ?? null,
    isDemo: true,
  };
}

export function encodeDemoSession(user: UserContext) {
  return encodeURIComponent(
    JSON.stringify({
      userId: user.userId,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    }),
  );
}

export function decodeDemoSession(value?: string | null): UserContext | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as {
      userId?: string;
      email?: string;
      displayName?: string;
      avatarUrl?: string;
    };

    if (!parsed.userId?.startsWith("demo:")) {
      return null;
    }

    return {
      userId: parsed.userId,
      email: parsed.email ?? null,
      displayName: parsed.displayName ?? "Demo player",
      avatarUrl: parsed.avatarUrl ?? null,
      isDemo: true,
    };
  } catch {
    return null;
  }
}
