import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { upsertZaloCustomer } from "@/app/actions/auth";
import {
  exchangeZaloToken,
  fetchZaloProfile,
  zaloConfigured,
} from "@/lib/zalo-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || url.searchParams.get("oauth_code");
  const state = url.searchParams.get("state") || "";
  const locale = state.startsWith("en.") ? "en" : "vi";

  if (!zaloConfigured() || !code) {
    return NextResponse.redirect(
      new URL(`/${locale}/account/login?error=zalo_failed`, url.origin),
    );
  }

  const jar = await cookies();
  const raw = jar.get("sf_zalo_pkce")?.value;
  jar.delete("sf_zalo_pkce");
  let verifier = "";
  try {
    const parsed = raw ? (JSON.parse(raw) as { verifier?: string; state?: string }) : {};
    if (parsed.state && parsed.state !== state) {
      return NextResponse.redirect(
        new URL(`/${locale}/account/login?error=zalo_state`, url.origin),
      );
    }
    verifier = parsed.verifier || "";
  } catch {
    verifier = "";
  }
  if (!verifier) {
    return NextResponse.redirect(
      new URL(`/${locale}/account/login?error=zalo_pkce`, url.origin),
    );
  }

  try {
    const token = await exchangeZaloToken({ code, codeVerifier: verifier });
    const profile = await fetchZaloProfile(token);
    await upsertZaloCustomer({
      zaloId: profile.id,
      name: profile.name,
      preferredLocale: locale,
    });
    return NextResponse.redirect(new URL(`/${locale}/account`, url.origin));
  } catch (error) {
    console.error("[zalo] oauth failed", error);
    return NextResponse.redirect(
      new URL(`/${locale}/account/login?error=zalo_failed`, url.origin),
    );
  }
}
