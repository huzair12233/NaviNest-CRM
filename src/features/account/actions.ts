"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { telegramLinkUrl, telegramConfigured } from "@/lib/telegram";
import { ActionState, fail, ok } from "@/lib/action-result";

export async function generateTelegramLink(): Promise<ActionState> {
  const user = await requireUser();
  if (!telegramConfigured()) return fail("Telegram isn't set up yet on the server.");

  const token = crypto.randomBytes(16).toString("hex");
  await db.user.update({ where: { id: user.id }, data: { telegramLinkToken: token } });
  const link = telegramLinkUrl(token);
  if (!link) return fail("Telegram bot username isn't configured.");

  revalidatePath("/account");
  return ok(undefined, { link });
}

export async function disconnectTelegram(): Promise<ActionState> {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { telegramChatId: null, telegramLinkToken: null } });
  revalidatePath("/account");
  return ok("Telegram disconnected");
}

export async function updateNotifyPrefs(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  await db.user.update({
    where: { id: user.id },
    data: {
      notifyByEmail: fd.get("notifyByEmail") === "on",
      notifyByTelegram: fd.get("notifyByTelegram") === "on",
    },
  });
  revalidatePath("/account");
  return ok("Preferences saved");
}
