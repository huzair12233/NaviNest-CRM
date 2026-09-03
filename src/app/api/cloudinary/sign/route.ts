import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cloudinaryConfigured, signedUploadParams } from "@/lib/cloudinary";

export async function POST() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!cloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary is not configured" }, { status: 503 });
  }
  return NextResponse.json(signedUploadParams());
}
