import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateDrawer } from "@/components/form/create-drawer";
import { TextField, SelectField } from "@/components/form/fields";
import { createProject } from "@/features/ops/actions";
import { Building2 } from "lucide-react";

export default async function ProjectsPage() {
  await requireUser();
  const projects = await db.project.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { properties: true } } },
  });

  return (
    <>
      <PageHeader
        title="Projects & Societies"
        subtitle="Named developments across Navi Mumbai used to group inventory."
        actions={
          <CreateDrawer label="Add Project" title="Add project / society" action={createProject} successToast="Project added">
            <TextField name="name" label="Project name" required />
            <TextField name="location" label="Locality" required />
            <SelectField name="type" label="Type" options={["Residential", "Commercial", "Mixed"]} defaultValue="Residential" />
            <TextField name="developer" label="Developer" />
          </CreateDrawer>
        }
      />
      {projects.length === 0 ? (
        <EmptyState icon={Building2} title="No projects yet" />
      ) : (
        <Table>
          <THead><tr><TH>Project</TH><TH>Locality</TH><TH>Type</TH><TH>Developer</TH><TH align="right">Properties</TH></tr></THead>
          <TBody>
            {projects.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium text-ink-900">{p.name}</TD>
                <TD className="text-sm">{p.location}</TD>
                <TD><Badge tone="slate">{p.type}</Badge></TD>
                <TD className="text-sm text-ink-500">{p.developer ?? "—"}</TD>
                <TD align="right">
                  <Link href={`/properties?q=${encodeURIComponent(p.name)}`} className="text-brand-700 hover:underline">
                    {p._count.properties}
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
