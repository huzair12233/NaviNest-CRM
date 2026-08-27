import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const notifCount = await db.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return (
    <Shell user={user} notifCount={notifCount}>
      {children}
    </Shell>
  );
}
