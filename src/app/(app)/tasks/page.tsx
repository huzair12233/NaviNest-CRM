import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskScope, isManager } from "@/lib/rbac";
import { getParam, type SearchParams } from "@/lib/pagination";
import { PageHeader, EmptyState, Avatar } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Badge, priorityTone } from "@/components/ui/badge";
import { TabLinks } from "@/components/ui/tabs";
import { CreateDrawer } from "@/components/form/create-drawer";
import { TextField, TextAreaField, SelectField } from "@/components/form/fields";
import { TaskCheckbox, TaskStatusSelect } from "@/features/ops/task-controls";
import { createTask } from "@/features/ops/actions";
import { PRIORITIES } from "@/lib/constants";
import { formatDate, cn } from "@/lib/utils";
import { CheckSquare } from "lucide-react";

export default async function TasksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const tab = getParam(sp, "tab") ?? "open";
  const scope = taskScope(user);

  const where = {
    AND: [scope, tab === "open" ? { status: { in: ["Pending", "InProgress"] } } : tab === "done" ? { status: "Completed" } : {}],
  };
  const [rows, team, openCount, doneCount] = await Promise.all([
    db.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
      include: {
        assignedTo: { select: { name: true, avatarColor: true } },
        lead: { select: { id: true, fullName: true } },
      },
    }),
    isManager(user) ? db.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }) : [],
    db.task.count({ where: { AND: [scope, { status: { in: ["Pending", "InProgress"] } }] } }),
    db.task.count({ where: { AND: [scope, { status: "Completed" }] } }),
  ]);

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Internal to-dos linked to leads and properties."
        actions={
          <CreateDrawer label="New Task" title="Create task" action={createTask} successToast="Task added">
            <TextField name="title" label="Task" required />
            <div className="grid grid-cols-2 gap-3">
              <TextField name="dueAt" label="Due date" type="date" />
              <SelectField name="priority" label="Priority" options={PRIORITIES} defaultValue="Normal" />
            </div>
            {team.length > 0 && (
              <SelectField name="assignedToId" label="Assign to" options={team.map((t) => ({ value: t.id, label: t.name }))} placeholder="Me" />
            )}
            <TextAreaField name="notes" label="Notes" />
          </CreateDrawer>
        }
      />

      <div className="mb-4">
        <TabLinks
          active={tab}
          tabs={[
            { key: "open", label: "Open", href: "/tasks?tab=open", count: openCount },
            { key: "done", label: "Completed", href: "/tasks?tab=done", count: doneCount },
            { key: "all", label: "All", href: "/tasks?tab=all" },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks here" description="Create a task to track internal work." />
      ) : (
        <Card className="divide-y divide-ink-100">
          {rows.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-4">
              <TaskCheckbox taskId={t.id} status={t.status} />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", t.status === "Completed" ? "text-ink-400 line-through" : "text-ink-900")}>
                  {t.title}
                </p>
                <p className="text-xs text-ink-400">
                  {t.dueAt ? `Due ${formatDate(t.dueAt)}` : "No due date"}
                  {t.lead && (
                    <> · <Link href={`/leads/${t.lead.id}`} className="hover:text-brand-700">{t.lead.fullName}</Link></>
                  )}
                  {t.notes ? ` · ${t.notes}` : ""}
                </p>
              </div>
              <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge>
              {t.assignedTo && <Avatar name={t.assignedTo.name} color={t.assignedTo.avatarColor} size={22} />}
              <TaskStatusSelect taskId={t.id} status={t.status} />
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
