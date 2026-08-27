import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { MarkAllReadButton, NotificationItem } from "@/features/ops/notification-controls";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : "You're all caught up."}
        actions={unread > 0 ? <MarkAllReadButton /> : undefined}
      />
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="You'll be notified about assigned leads, due follow-ups and deal updates." />
      ) : (
        <Card className="divide-y divide-ink-100">
          {notifications.map((n) => (
            <NotificationItem key={n.id} n={{ ...n, createdAt: n.createdAt.toISOString() }} />
          ))}
        </Card>
      )}
      <p className="mt-4 text-xs text-ink-400">
        Live push and email notifications are planned — see the roadmap. Today these are generated in-app when
        records change.
      </p>
    </>
  );
}
