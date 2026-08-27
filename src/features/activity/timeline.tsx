import { ACTIVITY_META } from "./meta";
import { Avatar } from "@/components/ui/misc";
import { formatDateTime, relativeTime } from "@/lib/utils";

type Item = {
  id: string;
  type: string;
  summary: string;
  createdAt: Date;
  user?: { name: string; avatarColor: string } | null;
};

export function Timeline({ items }: { items: Item[] }) {
  if (!items.length) {
    return <p className="px-1 py-8 text-center text-sm text-ink-400">No activity yet.</p>;
  }
  return (
    <ol className="relative space-y-4 before:absolute before:left-[13px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-ink-200">
      {items.map((a) => {
        const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.NOTE;
        return (
          <li key={a.id} className="relative flex gap-3">
            <span className={`z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full ring-4 ring-white ${meta.bg}`}>
              <meta.icon className={`h-3.5 w-3.5 ${meta.fg}`} />
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-sm text-ink-800">{a.summary}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400">
                {a.user && <Avatar name={a.user.name} color={a.user.avatarColor} size={14} />}
                <span>{a.user?.name ?? "System"}</span>
                <span>·</span>
                <span title={formatDateTime(a.createdAt)}>{relativeTime(a.createdAt)}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
