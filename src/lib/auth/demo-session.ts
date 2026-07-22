import type { UserContext } from "@/lib/types";

export const DEMO_SESSION_COOKIE = "playnext_demo_user";

export function createDemoUser(
  email: string,
  displayName?: string | null,
): UserContext {
  const normalizedEmail = email.trim().toLowerCase();
  return {
    userId: `demo:${normalizedEmail}`,
    email: normalizedEmail,
    displayName:
      displayName?.trim() || normalizedEmail.split("@")[0] || "Demo player",
    isDemo: true,
  };
}

export function encodeDemoSession(user: UserContext) {
  return encodeURIComponent(
    JSON.stringify({
      userId: user.userId,
      email: user.email,
      displayName: user.displayName,
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
    };

    if (!parsed.userId?.startsWith("demo:")) {
      return null;
    }

    return {
      userId: parsed.userId,
      email: parsed.email ?? null,
      displayName: parsed.displayName ?? "Demo player",
      isDemo: true,
    };
  } catch {
    return null;
  }
}
