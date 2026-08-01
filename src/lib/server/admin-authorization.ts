import type { UserContext } from "@/lib/types";

function parseCsv(value?: string) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminUser(user: UserContext | null) {
  if (!user || user.isDemo) {
    return false;
  }

  const adminEmails = parseCsv(process.env.ADMIN_EMAILS);
  const adminUserIds = parseCsv(process.env.ADMIN_USER_IDS);
  const email = user.email?.toLowerCase() ?? "";
  const userId = user.userId.toLowerCase();

  return adminEmails.has(email) || adminUserIds.has(userId);
}

export function isCronRequestAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}
