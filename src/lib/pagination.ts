export type SearchParams = { [k: string]: string | string[] | undefined };

export function getParam(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export function getPage(sp: SearchParams): number {
  const p = parseInt(getParam(sp, "page") ?? "1", 10);
  return Number.isFinite(p) && p > 0 ? p : 1;
}

export const PAGE_SIZE = 20;

export function paginate(sp: SearchParams, size = PAGE_SIZE) {
  const page = getPage(sp);
  return { page, skip: (page - 1) * size, take: size, pageSize: size };
}
