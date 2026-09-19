import "server-only";

function botToken() {
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

export function telegramConfigured() {
  return Boolean(botToken());
}

export function telegramBotUsername() {
  return process.env.TELEGRAM_BOT_USERNAME || null;
}

/** Deep link that opens a chat with the bot and auto-sends /start <token>. */
export function telegramLinkUrl(token: string): string | null {
  const username = telegramBotUsername();
  if (!username) return null;
  return `https://t.me/${username}?start=${token}`;
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = botToken();
  if (!token) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN not set — skipping send");
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!res.ok) {
      console.error("[telegram] send failed:", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[telegram] send threw:", e);
    return false;
  }
}

/** Register our webhook URL with Telegram. Run once after deploying (see README). */
export async function setTelegramWebhook(url: string, secretToken: string): Promise<{ ok: boolean; description?: string }> {
  const token = botToken();
  if (!token) return { ok: false, description: "TELEGRAM_BOT_TOKEN not set" };
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, secret_token: secretToken }),
  });
  return res.json();
}
