import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ActionForm, SubmitButton } from "@/components/form/action-form";
import { CheckboxField } from "@/components/form/fields";
import { TelegramConnect } from "@/features/account/telegram-connect";
import { updateNotifyPrefs } from "@/features/account/actions";
import { telegramConfigured } from "@/lib/telegram";
import { emailConfigured } from "@/lib/email";
import { Mail, Send } from "lucide-react";

export default async function AccountPage() {
  const user = await requireUser();
  const me = await db.user.findUniqueOrThrow({ where: { id: user.id } });

  return (
    <>
      <PageHeader title="Account" subtitle="Your login, and where follow-up reminders should reach you." />

      <div className="max-w-xl space-y-5">
        <Card>
          <CardHeader title="Profile" />
          <CardBody className="space-y-1 text-sm">
            <p className="font-medium text-ink-900">{me.name}</p>
            <p className="text-ink-500">{me.email}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Follow-up reminders"
            subtitle="Get pinged automatically at the moment a follow-up is due — no need to keep checking the CRM."
          />
          <CardBody className="space-y-5">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-800">
                <Mail className="h-4 w-4 text-ink-400" /> Email
              </div>
              {emailConfigured() ? (
                <p className="text-sm text-ink-500">Reminders will be sent to {me.email}.</p>
              ) : (
                <p className="text-sm text-ink-500">
                  Email isn&apos;t set up on the server yet — an admin needs to add{" "}
                  <code className="rounded bg-ink-100 px-1">GMAIL_APP_PASSWORD</code> (see README).
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-800">
                <Send className="h-4 w-4 text-ink-400" /> Telegram
              </div>
              <TelegramConnect connected={!!me.telegramChatId} configured={telegramConfigured()} />
            </div>

            <ActionForm action={updateNotifyPrefs} successToast="Preferences saved" className="border-t border-ink-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Send reminders via</p>
              <CheckboxField name="notifyByEmail" label="Email" defaultChecked={me.notifyByEmail} />
              <CheckboxField name="notifyByTelegram" label="Telegram" defaultChecked={me.notifyByTelegram} />
              <div className="mt-4">
                <SubmitButton>Save</SubmitButton>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
