import { createHash, randomBytes } from "node:crypto";

export function zaloConfigured() {
  return Boolean(
    process.env.ZALO_APP_ID?.trim() && process.env.ZALO_APP_SECRET?.trim(),
  );
}

export function zaloAppId() {
  return process.env.ZALO_APP_ID?.trim() || "";
}

export function zaloAppSecret() {
  return process.env.ZALO_APP_SECRET?.trim() || "";
}

/** PKCE verifier: 43+ chars of unreserved URL-safe alphabet. */
export function createCodeVerifier() {
  return randomBytes(32).toString("base64url");
}

export function createCodeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function zaloAuthorizeUrl(input: {
  redirectUri: string;
  codeChallenge: string;
  state: string;
}) {
  const params = new URLSearchParams({
    app_id: zaloAppId(),
    redirect_uri: input.redirectUri,
    code_challenge: input.codeChallenge,
    state: input.state,
  });
  return `https://oauth.zaloapp.com/v4/permission?${params.toString()}`;
}

export async function exchangeZaloToken(input: {
  code: string;
  codeVerifier: string;
}) {
  const body = new URLSearchParams({
    code: input.code,
    app_id: zaloAppId(),
    grant_type: "authorization_code",
    code_verifier: input.codeVerifier,
  });
  const res = await fetch("https://oauth.zaloapp.com/v4/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: zaloAppSecret(),
    },
    body,
  });
  const json = (await res.json()) as {
    access_token?: string;
    error?: number;
    error_description?: string;
    message?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.message || "zalo_token_failed");
  }
  return json.access_token;
}

export async function fetchZaloProfile(accessToken: string) {
  const res = await fetch(
    `https://graph.zalo.me/v2.0/me?fields=id,name,picture`,
    {
      headers: { access_token: accessToken },
    },
  );
  const json = (await res.json()) as {
    id?: string;
    name?: string;
    error?: number;
    message?: string;
  };
  if (!res.ok || !json.id) {
    throw new Error(json.message || "zalo_profile_failed");
  }
  return { id: String(json.id), name: json.name || null };
}
