import nodemailer from "nodemailer";
import { getAppOrigin } from "@/lib/auth/env";

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let transporter: nodemailer.Transporter | null = null;

function smtpPort() {
  const parsed = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
  return Number.isFinite(parsed) ? parsed : 587;
}

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.SMTP_FROM,
  );
}

function getTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }

  if (transporter) {
    return transporter;
  }

  const port = smtpPort();
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!,
    },
  });

  return transporter;
}

export async function sendEmail(message: EmailMessage) {
  const mailer = getTransporter();
  if (!mailer) {
    throw new Error(
      "SMTP is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM.",
    );
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM!,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function emailLayout({
  preheader,
  title,
  body,
  ctaHref,
  ctaLabel,
  footer = "You are receiving this because you have a PlayNext account. Manage email preferences from Settings.",
}: {
  preheader: string;
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  footer?: string;
}) {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);
  const safeCtaHref = escapeHtml(ctaHref);
  const safeCtaLabel = escapeHtml(ctaLabel);
  const safeFooter = escapeHtml(footer);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;background:#101417;color:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">${safePreheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#101417;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#182027;border:1px solid #334151;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 12px;">
                <div style="display:inline-block;background:#67e8f9;color:#081014;border-radius:8px;padding:8px 10px;font-weight:800;">PlayNext</div>
                <h1 style="margin:24px 0 0;font-size:30px;line-height:1.12;color:#ffffff;">${safeTitle}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 20px;color:#cbd5e1;font-size:16px;line-height:1.65;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 30px;">
                <a href="${safeCtaHref}" style="display:inline-block;background:#39dc86;color:#07110d;text-decoration:none;font-weight:900;border-radius:10px;padding:13px 18px;">${safeCtaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #334151;padding:18px 28px;color:#94a3b8;font-size:12px;line-height:1.5;">
                ${safeFooter}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function appHref(path = "/", request?: Request) {
  return new URL(path, getAppOrigin(request)).toString();
}
