import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendTelegramMessage } from "@/lib/telegram";
import { formatDateTime } from "@/lib/utils";

// How far back we'll still send a "due" reminder for — protects against a flood
// of ancient reminders if the cron was ever down for a while.
const LOOKBACK_MINUTES = 120;

function authorized(req: Request) {
  const header = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return header === `Bearer ${secret}`;
}

async function run() {
  const now = new Date();
  const from = new Date(now.getTime() - LOOKBACK_MINUTES * 60_000);

  const due = await db.followUp.findMany({
    where: { status: "Pending", reminderSentAt: null, dueAt: { lte: now, gte: from } },
    include: {
      lead: { select: { id: true, code: true, fullName: true, phone: true } },
      assignedTo: {
        select: { id: true, name: true, email: true, telegramChatId: true, notifyByEmail: true, notifyByTelegram: true },
      },
    },
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://navinestcrm.vercel.app").replace(/\/$/, "");
  let emailed = 0;
  let telegrammed = 0;

  for (const f of due) {
    const user = f.assignedTo;
    if (!user) {
      await db.followUp.update({ where: { id: f.id }, data: { reminderSentAt: now } });
      continue;
    }
    const link = `${appUrl}/leads/${f.lead.id}`;
    const when = formatDateTime(f.dueAt);

    if (user.notifyByEmail && user.email) {
      const html = `
        <p>Hi ${user.name.split(" ")[0]},</p>
        <p>Your follow-up with <b>${f.lead.fullName}</b> (${f.lead.phone}) is due now.</p>
        <p><b>Type:</b> ${f.type}${f.purpose ? `<br/><b>Purpose:</b> ${f.purpose}` : ""}<br/><b>Due:</b> ${when}</p>
        <p><a href="${link}">Open ${f.lead.code} in NaviNest CRM →</a></p>
      `;
      const sent = await sendEmail({ to: user.email, subject: `Follow-up due now: ${f.lead.fullName}`, html });
      if (sent) emailed++;
    }

    if (user.notifyByTelegram && user.telegramChatId) {
      const text = [
        `📞 <b>Follow-up due now</b>`,
        `${f.lead.fullName} (${f.lead.phone})`,
        `${f.type}${f.purpose ? ` — ${f.purpose}` : ""}`,
        `Due: ${when}`,
        `<a href="${link}">Open ${f.lead.code} in CRM</a>`,
      ].join("\n");
      const sent = await sendTelegramMessage(user.telegramChatId, text);
      if (sent) telegrammed++;
    }

    await db.followUp.update({ where: { id: f.id }, data: { reminderSentAt: now } });
  }

  return { checked: due.length, emailed, telegrammed };
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const result = await run();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: Request) {
  return GET(req);
}
