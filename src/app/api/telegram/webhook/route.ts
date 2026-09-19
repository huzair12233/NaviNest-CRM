import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";

type TelegramUpdate = {
  message?: {
    chat: { id: number };
    text?: string;
    from?: { first_name?: string };
  };
};

export async function POST(req: Request) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update: TelegramUpdate = await req.json().catch(() => ({}));
  const msg = update.message;
  const chatId = msg?.chat?.id;
  const text = msg?.text?.trim();

  if (chatId && text?.startsWith("/start")) {
    const token = text.replace("/start", "").trim();
    if (token) {
      const user = await db.user.findFirst({ where: { telegramLinkToken: token } });
      if (user) {
        await db.user.update({
          where: { id: user.id },
          data: { telegramChatId: String(chatId), telegramLinkToken: null },
        });
        await sendTelegramMessage(
          String(chatId),
          `✅ Connected! Hi ${user.name.split(" ")[0]}, NaviNest CRM will send your follow-up reminders here.`,
        );
      } else {
        await sendTelegramMessage(String(chatId), "This link has expired. Generate a new one from Account settings in the CRM.");
      }
    } else {
      await sendTelegramMessage(String(chatId), "Open this chat from the “Connect Telegram” button in NaviNest CRM → Account settings.");
    }
  }

  // Always 200 — Telegram retries aggressively on non-2xx.
  return NextResponse.json({ ok: true });
}
