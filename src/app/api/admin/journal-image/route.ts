import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { uploadJournalImage } from "@/lib/journal-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "file too large" }, { status: 400 });
    }
    const kindRaw = String(form.get("kind") || "inline");
    const kind = kindRaw === "cover" ? "cover" : "inline";
    const postSlug = String(form.get("slug") || "draft");
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadJournalImage({
      bytes,
      filenameHint: file.name,
      postSlug,
      kind,
    });
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
