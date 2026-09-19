import "server-only";
import nodemailer from "nodemailer";

// Sends via the brokerage's own Gmail account (SMTP + an App Password) —
// no domain to own or verify, unlike a transactional-email provider such as
// Resend. Free within Gmail's normal sending limits (~500/day on a regular
// Gmail account), which is far more than a small brokerage's reminder volume.

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
}

export function emailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.warn("[email] GMAIL_USER/GMAIL_APP_PASSWORD not set — skipping send:", input.subject);
    return false;
  }
  try {
    await t.sendMail({
      from: `NaviNest CRM <${process.env.GMAIL_USER}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return true;
  } catch (e) {
    console.error("[email] send failed:", e);
    return false;
  }
}
