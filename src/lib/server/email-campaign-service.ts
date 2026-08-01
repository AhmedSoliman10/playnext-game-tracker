import type { User } from "@supabase/supabase-js";
import { getCachedPopularGames } from "@/lib/games/cached-provider";
import {
  appHref,
  emailLayout,
  escapeHtml,
  isEmailConfigured,
  sendEmail,
} from "@/lib/server/email-service";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const PAGE_SIZE = 1000;
const SEND_DELAY_MS = 250;

interface EmailRecipient {
  userId: string;
  email: string;
  displayName: string;
}

export interface CampaignResult {
  recipients: number;
  sent: number;
  skipped: number;
  errors: string[];
  dryRun: boolean;
}

function userDisplayName(user: User) {
  const displayName = user.user_metadata?.display_name;
  if (typeof displayName === "string" && displayName.trim()) {
    return displayName.trim();
  }

  return user.email?.split("@")[0] ?? "player";
}

async function waitBetweenEmails() {
  await new Promise((resolve) => setTimeout(resolve, SEND_DELAY_MS));
}

function isSignedInEmailUser(user: User) {
  return Boolean(user.email && user.last_sign_in_at && !user.banned_until);
}

async function listSignedInEmailUsers(limit?: number) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase service role is required to list email users.");
  }

  const users: EmailRecipient[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (error) {
      throw new Error("Could not list Supabase users.");
    }

    for (const user of data.users) {
      if (!isSignedInEmailUser(user) || !user.email) {
        continue;
      }

      users.push({
        userId: user.id,
        email: user.email,
        displayName: userDisplayName(user),
      });

      if (limit && users.length >= limit) {
        return users;
      }
    }

    if (data.users.length < PAGE_SIZE) {
      break;
    }
  }

  return users;
}

function whatsNewBody(displayName: string, request?: Request) {
  const settingsHref = appHref("/settings", request);
  return `
    <p style="margin:0 0 18px;">Hey ${escapeHtml(displayName)},</p>
    <p style="margin:0 0 18px;">PlayNext just got a big upgrade. It is no longer only a place to track games; it is starting to feel like a tiny gaming community built around your taste.</p>
    <ul style="margin:0 0 18px;padding-left:20px;">
      <li><strong>Discord connect:</strong> link Discord from Settings and show it on your profile.</li>
      <li><strong>Public profiles:</strong> browse libraries, ratings, reviews, shelves, and taste compatibility.</li>
      <li><strong>Community reactions and comments:</strong> respond to public activity without leaving PlayNext.</li>
      <li><strong>Custom shelves:</strong> make your own public or private game collections.</li>
      <li><strong>Steam and CSV import:</strong> move your library into PlayNext faster.</li>
      <li><strong>Smarter recommendations:</strong> hide, tune, and explain the games PlayNext suggests next.</li>
      <li><strong>Weekly digest:</strong> get the best activity and next-game picks in your inbox.</li>
    </ul>
    <p style="margin:0 0 18px;">The best test is simple: open PlayNext, rate one game you truly loved, then check what it recommends next.</p>
    <p style="margin:0;color:#94a3b8;font-size:13px;">You can manage weekly digest email from <a href="${escapeHtml(settingsHref)}" style="color:#67e8f9;">Settings</a>.</p>
  `;
}

function whatsNewText(displayName: string, request?: Request) {
  return `Hey ${displayName},

PlayNext just got a big upgrade.

New:
- Discord connect from Settings
- Public profiles with libraries, ratings, reviews, shelves, and taste compatibility
- Community reactions and comments
- Custom shelves
- Steam and CSV import
- Smarter recommendation feedback
- Weekly digest emails

Open PlayNext, rate one game you truly loved, and check what it recommends next:
${appHref("/dashboard", request)}

Manage email preferences:
${appHref("/settings", request)}
`;
}

async function createWhatsNewNotifications(recipients: EmailRecipient[]) {
  const admin = createSupabaseAdminClient();
  if (!admin || recipients.length === 0) {
    return;
  }

  const now = new Date().toISOString();
  const rows = recipients.map((recipient) => ({
    recipient_user_id: recipient.userId,
    notification_type: "system" as const,
    title: "PlayNext just got social",
    body: "Discord connect, public profiles, comments, shelves, Steam import, and smarter recommendation feedback are live.",
    link_href: "/dashboard",
    metadata: { campaign: "playnext-social-update-2026-08-01" },
    created_at: now,
    updated_at: now,
  }));

  const { error } = await admin.from("notifications").insert(rows);
  if (error && error.code !== "42P01") {
    throw new Error("Could not create product update notifications.");
  }
}

export async function sendWhatsNewCampaign({
  request,
  dryRun = false,
  limit,
}: {
  request?: Request;
  dryRun?: boolean;
  limit?: number;
}): Promise<CampaignResult> {
  const recipients = await listSignedInEmailUsers(limit);
  const result: CampaignResult = {
    recipients: recipients.length,
    sent: 0,
    skipped: 0,
    errors: [],
    dryRun,
  };

  if (!dryRun && !isEmailConfigured()) {
    throw new Error(
      "SMTP is not configured. Add SMTP env vars before sending product emails.",
    );
  }

  if (dryRun) {
    return result;
  }

  await createWhatsNewNotifications(recipients);

  for (const recipient of recipients) {
    try {
      await sendEmail({
        to: recipient.email,
        subject:
          "PlayNext just got social: Discord, shelves, Steam import, and smarter picks",
        text: whatsNewText(recipient.displayName, request),
        html: emailLayout({
          preheader:
            "Discord connect, public profiles, comments, shelves, Steam import, and smarter recommendations are live.",
          title: "PlayNext just got a serious upgrade",
          body: whatsNewBody(recipient.displayName, request),
          ctaHref: appHref("/dashboard", request),
          ctaLabel: "See what's new",
        }),
      });
      result.sent += 1;
      await waitBetweenEmails();
    } catch (error) {
      result.skipped += 1;
      result.errors.push(
        `${recipient.email}: ${
          error instanceof Error ? error.message : "Could not send email."
        }`,
      );
    }
  }

  return result;
}

async function usersWithDigestEnabled(recipients: EmailRecipient[]) {
  const admin = createSupabaseAdminClient();
  if (!admin || recipients.length === 0) {
    return [];
  }

  const { data, error } = await admin
    .from("notification_preferences")
    .select("user_id, email_digest_enabled")
    .in(
      "user_id",
      recipients.map((recipient) => recipient.userId),
    );

  if (error && error.code !== "42P01") {
    throw new Error("Could not load notification preferences.");
  }

  const preferences = new Map(
    (data ?? []).map((row) => [row.user_id, row.email_digest_enabled]),
  );

  return recipients.filter(
    (recipient) => preferences.get(recipient.userId) !== false,
  );
}

async function loadDigestStats(userId: string, since: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      notificationCount: 0,
      ratingCount: 0,
      backlogCount: 0,
      topNotifications: [] as Array<{ title: string; body: string }>,
    };
  }

  const [notifications, ratings, backlog] = await Promise.all([
    admin
      .from("notifications")
      .select("title, body", { count: "exact" })
      .eq("recipient_user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(3),
    admin
      .from("ratings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("updated_at", since),
    admin
      .from("user_games")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "want_to_play"),
  ]);

  return {
    notificationCount: notifications.count ?? 0,
    ratingCount: ratings.count ?? 0,
    backlogCount: backlog.count ?? 0,
    topNotifications: notifications.data ?? [],
  };
}

async function digestBody(recipient: EmailRecipient, request?: Request) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [stats, popularGames] = await Promise.all([
    loadDigestStats(recipient.userId, since),
    getCachedPopularGames({ pageSize: 3 }),
  ]);
  const notificationItems = stats.topNotifications
    .map(
      (notification) =>
        `<li><strong>${escapeHtml(notification.title)}</strong><br /><span style="color:#cbd5e1;">${escapeHtml(notification.body)}</span></li>`,
    )
    .join("");
  const popularItems = popularGames
    .map(
      (game) =>
        `<li><strong>${escapeHtml(game.title)}</strong> ${game.externalRating ? `(${game.externalRating}/10)` : ""}<br /><span style="color:#cbd5e1;">${escapeHtml(game.genres.slice(0, 2).join(", ") || "Popular now")}</span></li>`,
    )
    .join("");

  return `
    <p style="margin:0 0 18px;">Hey ${escapeHtml(recipient.displayName)}, here is your PlayNext week.</p>
    <div style="background:#11181f;border:1px solid #334151;border-radius:12px;padding:16px;margin:0 0 18px;">
      <p style="margin:0;"><strong>${stats.notificationCount}</strong> community update${stats.notificationCount === 1 ? "" : "s"} this week</p>
      <p style="margin:8px 0 0;"><strong>${stats.ratingCount}</strong> rating update${stats.ratingCount === 1 ? "" : "s"} saved this week</p>
      <p style="margin:8px 0 0;"><strong>${stats.backlogCount}</strong> game${stats.backlogCount === 1 ? "" : "s"} waiting in your Backlog</p>
    </div>
    ${
      notificationItems
        ? `<h2 style="font-size:18px;margin:0 0 10px;color:#ffffff;">Community highlights</h2><ul style="margin:0 0 18px;padding-left:20px;">${notificationItems}</ul>`
        : `<p style="margin:0 0 18px;color:#cbd5e1;">No big community updates this week. Rate one game or follow a player to make next week's digest sharper.</p>`
    }
    <h2 style="font-size:18px;margin:0 0 10px;color:#ffffff;">Popular right now</h2>
    <ul style="margin:0 0 18px;padding-left:20px;">${popularItems}</ul>
    <p style="margin:0;color:#94a3b8;font-size:13px;">Manage weekly digest email from <a href="${escapeHtml(appHref("/settings", request))}" style="color:#67e8f9;">Settings</a>.</p>
  `;
}

function digestText(recipient: EmailRecipient, request?: Request) {
  return `Hey ${recipient.displayName},

Your weekly PlayNext digest is ready.

Open your dashboard:
${appHref("/dashboard", request)}

Manage email preferences:
${appHref("/settings", request)}
`;
}

export async function sendWeeklyDigestCampaign({
  request,
  dryRun = false,
  limit,
}: {
  request?: Request;
  dryRun?: boolean;
  limit?: number;
}): Promise<CampaignResult> {
  const allRecipients = await listSignedInEmailUsers(limit);
  const recipients = await usersWithDigestEnabled(allRecipients);
  const result: CampaignResult = {
    recipients: recipients.length,
    sent: 0,
    skipped: allRecipients.length - recipients.length,
    errors: [],
    dryRun,
  };

  if (!dryRun && !isEmailConfigured()) {
    throw new Error(
      "SMTP is not configured. Add SMTP env vars before sending weekly digest email.",
    );
  }

  if (dryRun) {
    return result;
  }

  for (const recipient of recipients) {
    try {
      await sendEmail({
        to: recipient.email,
        subject: "Your PlayNext weekly digest is ready",
        text: digestText(recipient, request),
        html: emailLayout({
          preheader:
            "Community updates, backlog reminders, and popular games for your week.",
          title: "Your PlayNext week",
          body: await digestBody(recipient, request),
          ctaHref: appHref("/dashboard", request),
          ctaLabel: "Open PlayNext",
        }),
      });
      result.sent += 1;
      await waitBetweenEmails();
    } catch (error) {
      result.skipped += 1;
      result.errors.push(
        `${recipient.email}: ${
          error instanceof Error ? error.message : "Could not send digest."
        }`,
      );
    }
  }

  return result;
}
