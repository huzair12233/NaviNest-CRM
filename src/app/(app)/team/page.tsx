import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Avatar } from "@/components/ui/misc";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateDrawer } from "@/components/form/create-drawer";
import { TextField, SelectField } from "@/components/form/fields";
import { EditUserButton } from "@/features/ops/edit-user-button";
import { createUser } from "@/features/ops/actions";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function TeamPage() {
  await requireRole("ADMIN");
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { leads: true, deals: true } } },
  });

  return (
    <>
      <PageHeader
        title="Team"
        subtitle="Members and their access level. Permissions are enforced on the server."
        actions={
          <CreateDrawer label="Add Member" title="Add team member" action={createUser} successToast="Member added">
            <TextField name="name" label="Full name" required />
            <TextField name="email" label="Email" type="email" required />
            <TextField name="phone" label="Phone" type="tel" />
            <SelectField name="role" label="Role" options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} defaultValue="SALES" required />
            <TextField name="password" label="Temporary password" type="text" required />
          </CreateDrawer>
        }
      />

      <Table>
        <THead><tr><TH>Member</TH><TH>Email</TH><TH>Role</TH><TH align="right">Leads</TH><TH align="right">Deals</TH><TH>Status</TH><TH>Joined</TH><TH></TH></tr></THead>
        <TBody>
          {users.map((u) => (
            <TR key={u.id}>
              <TD><span className="flex items-center gap-2"><Avatar name={u.name} color={u.avatarColor} size={24} /><span className="font-medium text-ink-900">{u.name}</span></span></TD>
              <TD className="text-sm text-ink-500">{u.email}</TD>
              <TD><Badge tone={u.role === "ADMIN" ? "brand" : u.role === "MANAGER" ? "violet" : "slate"}>{ROLE_LABELS[u.role]}</Badge></TD>
              <TD align="right">{u._count.leads}</TD>
              <TD align="right">{u._count.deals}</TD>
              <TD><Badge tone={u.active ? "emerald" : "slate"}>{u.active ? "Active" : "Disabled"}</Badge></TD>
              <TD className="text-xs text-ink-500">{formatDate(u.createdAt)}</TD>
              <TD><EditUserButton user={{ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, active: u.active }} /></TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </>
  );
}
