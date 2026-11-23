import { NextRequest, NextResponse } from "next/server";

/**
 * Same-origin proxy for VietQR PNGs so mobile can save to Photos.
 * Cross-origin `<a download>` is ignored on iOS Safari ("Cannot save this image").
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url")?.trim() || "";
  if (!raw) {
    return NextResponse.json({ error: "missing_url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "bad_url" }, { status: 400 });
  }

  if (target.protocol !== "https:") {
    return NextResponse.json({ error: "https_only" }, { status: 400 });
  }
  if (target.hostname !== "img.vietqr.io") {
    return NextResponse.json({ error: "host_not_allowed" }, { status: 400 });
  }

  const upstream = await fetch(target.toString(), {
    headers: { Accept: "image/png,image/*,*/*" },
    next: { revalidate: 60 },
  });
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "upstream", status: upstream.status },
      { status: 502 },
    );
  }

  const bytes = await upstream.arrayBuffer();
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "image/png",
      "Cache-Control": "public, max-age=300",
      "Content-Disposition": 'inline; filename="vietqr.png"',
    },
  });
}
