import { getAuthConfirmFlowUrl } from "@/lib/auth/env";
import {
  emailLayout,
  escapeHtml,
  isEmailConfigured,
  sendEmail,
} from "@/lib/server/email-service";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface PasswordResetEmail {
  subject: string;
  text: string;
  html: string;
}

export type PasswordResetFallbackResult =
  | { ok: true; sent: boolean }
  | {
      ok: false;
      reason: "not_configured" | "link_generation_failed" | "send_failed";
    };

function isMissingUserError(error: { status?: number; message: string }) {
  const message = error.message.toLowerCase();
  return (
    error.status === 404 ||
    message.includes("user not found") ||
    message.includes("no user")
  );
}

export function buildPasswordResetEmail({
  email,
  actionLink,
}: {
  email: string;
  actionLink: string;
}): PasswordResetEmail {
  const safeEmail = escapeHtml(email);
  const subject = "Reset your Playnira password";
  const text = [
    "Reset your Playnira password",
    "",
    `We received a request to reset the password for ${email}.`,
    "Open the secure link below to choose a new password:",
    actionLink,
    "",
    "This link expires soon and can only be used once.",
    "If you did not request this, you can ignore this email.",
    "If you cannot find Playnira emails later, check your junk or spam folder too.",
  ].join("\n");
  const html = emailLayout({
    preheader: "Use this secure link to reset your Playnira password.",
    title: "Reset your Playnira password",
    body: `
      <p style="margin:0 0 18px;">We received a request to reset the password for <strong>${safeEmail}</strong>.</p>
      <p style="margin:0 0 18px;">Use the secure button below to choose a new password. This link expires soon and can only be used once.</p>
      <p style="margin:0;">If you did not request this, you can ignore this email. If you do not see Playnira emails later, check your junk or spam folder too.</p>
    `,
    ctaHref: actionLink,
    ctaLabel: "Reset password",
    footer:
      "You are receiving this because someone requested a password reset for this Playnira account. If that was not you, ignore this email.",
  });

  return { subject, text, html };
}

export async function sendPasswordResetWithAppMailer({
  email,
  request,
}: {
  email: string;
  request: Request;
}): Promise<PasswordResetFallbackResult> {
  const admin = createSupabaseAdminClient();
  if (!admin || !isEmailConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: getAuthConfirmFlowUrl(request, "reset"),
    },
  });

  if (error) {
    if (isMissingUserError(error)) {
      return { ok: true, sent: false };
    }

    return { ok: false, reason: "link_generation_failed" };
  }

  const actionLink = data.properties?.action_link;
  if (!actionLink) {
    return { ok: false, reason: "link_generation_failed" };
  }

  const message = buildPasswordResetEmail({ email, actionLink });

  try {
    await sendEmail({
      to: email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  } catch {
    return { ok: false, reason: "send_failed" };
  }

  return { ok: true, sent: true };
}
