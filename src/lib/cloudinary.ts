import "server-only";
import crypto from "crypto";

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;

export const CLOUDINARY_FOLDER = "navinest/properties";

export function cloudinaryConfigured() {
  return Boolean(CLOUD && KEY && SECRET);
}

/** Cloudinary signature: sha1 of `k=v&k=v...` (sorted, excl. file/api_key/etc) + api_secret. */
function sign(params: Record<string, string | number>) {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + SECRET).digest("hex");
}

/** Params the browser needs to POST a signed upload directly to Cloudinary. */
export function signedUploadParams() {
  if (!cloudinaryConfigured()) throw new Error("Cloudinary is not configured");
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = CLOUDINARY_FOLDER;
  const signature = sign({ folder, timestamp });
  return {
    cloudName: CLOUD!,
    apiKey: KEY!,
    timestamp,
    folder,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
  };
}

/** Permanently delete an asset from Cloudinary. */
export async function destroyImage(publicId: string) {
  if (!cloudinaryConfigured() || !publicId) return;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp });
  const body = new URLSearchParams({
    public_id: publicId,
    api_key: KEY!,
    timestamp: String(timestamp),
    signature,
  });
  try {
    await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/destroy`, {
      method: "POST",
      body,
    });
  } catch {
    /* best-effort — a lingering asset is harmless */
  }
}
