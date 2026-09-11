import "server-only";
import { db } from "@/lib/db";
import { listingPrice } from "@/lib/utils";

export async function dealFormOptions() {
  const [leads, properties, owners, team] = await Promise.all([
    db.lead.findMany({ orderBy: { lastActivityAt: "desc" }, take: 200, select: { id: true, code: true, fullName: true } }),
    db.property.findMany({ orderBy: { createdAt: "desc" }, take: 200, select: { id: true, code: true, title: true, salePrice: true, rent: true, deposit: true, listingType: true } }),
    db.owner.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return {
    leads: leads.map((l) => ({ value: l.id, label: `${l.fullName} · ${l.code}` })),
    properties: properties.map((p) => ({
      value: p.id,
      label: `${p.title} · ${listingPrice(p)}`,
    })),
    owners: owners.map((o) => ({ value: o.id, label: o.name })),
    team: team.map((t) => ({ value: t.id, label: t.name })),
  };
}
