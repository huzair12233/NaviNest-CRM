import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { leadScope } from "@/lib/rbac";
import { listingPrice } from "@/lib/utils";

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ hits: [] }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ hits: [] });

  const like = { contains: q };
  const [leads, properties, owners, contacts, deals] = await Promise.all([
    db.lead.findMany({
      where: { AND: [leadScope(user), { OR: [{ fullName: like }, { phone: like }, { code: like }] }] },
      take: 6,
      select: { id: true, code: true, fullName: true, phone: true, status: true },
    }),
    db.property.findMany({
      where: { OR: [{ title: like }, { code: like }, { location: like }, { address: like }] },
      take: 6,
      select: { id: true, code: true, title: true, location: true, listingType: true, salePrice: true, rent: true, deposit: true },
    }),
    db.owner.findMany({
      where: { OR: [{ name: like }, { phone: like }] },
      take: 4,
      select: { id: true, name: true, phone: true },
    }),
    db.contact.findMany({
      where: { OR: [{ name: like }, { phone: like }] },
      take: 4,
      select: { id: true, name: true, phone: true, type: true },
    }),
    db.deal.findMany({
      where: { OR: [{ title: like }, { code: like }] },
      take: 4,
      select: { id: true, code: true, title: true, stage: true },
    }),
  ]);

  const hits = [
    ...leads.map((l) => ({ type: "Leads", label: `${l.fullName}`, sub: `${l.code} · ${l.phone} · ${l.status}`, href: `/leads/${l.id}` })),
    ...properties.map((p) => ({
      type: "Properties",
      label: p.title,
      sub: `${p.code} · ${p.location} · ${listingPrice(p)}`,
      href: `/properties/${p.id}`,
    })),
    ...owners.map((o) => ({ type: "Owners", label: o.name, sub: o.phone, href: `/owners/${o.id}` })),
    ...contacts.map((c) => ({ type: "Contacts", label: c.name, sub: `${c.type} · ${c.phone}`, href: `/contacts/${c.id}` })),
    ...deals.map((d) => ({ type: "Deals", label: d.title, sub: `${d.code} · ${d.stage}`, href: `/deals/${d.id}` })),
  ];

  return NextResponse.json({ hits });
}
