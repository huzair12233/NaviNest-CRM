export type Photo = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
};

export function parsePhotos(json: unknown): Photo[] {
  let arr: unknown = json;
  if (typeof json === "string") {
    if (!json.trim()) return [];
    try {
      arr = JSON.parse(json);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.filter(
    (p): p is Photo =>
      !!p && typeof p === "object" && typeof (p as Photo).url === "string" && typeof (p as Photo).publicId === "string",
  );
}

/** Insert a transformation into a Cloudinary delivery URL. */
export function cldTransform(url: string, t: string): string {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${t}/`);
}

export const cldThumb = (url: string, w = 400, h = 300) =>
  cldTransform(url, `c_fill,w_${w},h_${h},g_auto,f_auto,q_auto`);

export const cldCard = (url: string) => cldTransform(url, "c_fill,w_120,h_90,g_auto,f_auto,q_auto");

export const cldFull = (url: string) => cldTransform(url, "c_limit,w_1600,h_1600,f_auto,q_auto");
