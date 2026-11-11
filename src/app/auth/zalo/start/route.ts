import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { siteUrl } from "@/lib/seo";
import {
  createCodeChallenge,
  createCodeVerifier,
  zaloAuthorizeUrl,
  zaloConfigured,
} from "@/lib/zalo-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "vi";

  if (!zaloConfigured()) {
    return NextResponse.redirect(
      new URL(`/${locale}/account/login?error=zalo_not_configured`, url.origin),
    );
  }

  const verifier = createCodeVerifier();
  const challenge = createCodeChallenge(verifier);
  const state = `${locale}.${randomState()}`;
  const jar = await cookies();
  jar.set("sf_zalo_pkce", JSON.stringify({ verifier, state }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const redirectUri = siteUrl("/auth/zalo/callback");
  const authorize = zaloAuthorizeUrl({
    redirectUri,
    codeChallenge: challenge,
    state,
  });
  return NextResponse.redirect(authorize);
}

function randomState() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
