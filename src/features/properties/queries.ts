import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getParam, paginate, type SearchParams } from "@/lib/pagination";

export async function getProperties(sp: SearchParams) {
  const { skip, take, page, pageSize } = paginate(sp);
  const and: Prisma.PropertyWhereInput[] = [];

  const q = getParam(sp, "q")?.trim();
  if (q) and.push({ OR: [{ title: { contains: q } }, { code: { contains: q } }, { location: { contains: q } }, { address: { contains: q } }] });

  for (const key of ["listingType", "segment", "propertyType", "status"] as const) {
    const v = getParam(sp, key);
    if (v) and.push({ [key]: v });
  }
  const bhk = getParam(sp, "bhk");
  if (bhk) and.push({ bhk: Number(bhk) });
  const location = getParam(sp, "location");
  if (location) and.push({ location: { contains: location } });

  // Budget — compares against whichever price field applies to that row's
  // listing type, so the same Min/Max works across Sale, Rent and Heavy Deposit.
  const priceMin = getParam(sp, "priceMin");
  const priceMax = getParam(sp, "priceMax");
  if (priceMin || priceMax) {
    const range: Prisma.IntFilter = {
      ...(priceMin ? { gte: Number(priceMin) } : {}),
      ...(priceMax ? { lte: Number(priceMax) } : {}),
    };
    and.push({
      OR: [
        { listingType: "SALE", salePrice: range },
        { listingType: "RENT", rent: range },
        { listingType: "HEAVY_DEPOSIT", deposit: range },
      ],
    });
  }

  const sort = getParam(sp, "sort") ?? "recent";
  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    sort === "price-asc"
      ? { salePrice: "asc" }
      : sort === "price-desc"
        ? { salePrice: "desc" }
        : { createdAt: "desc" };

  const where: Prisma.PropertyWhereInput = { AND: and };
  const [rows, total] = await Promise.all([
    db.property.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        owner: { select: { name: true } },
        project: { select: { name: true } },
        _count: { select: { interests: true, siteVisits: true } },
      },
    }),
    db.property.count({ where }),
  ]);
  return { rows, total, page, pageSize };
}
