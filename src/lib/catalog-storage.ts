import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const CATALOG_BUCKET = "catalog";

export function getSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).replace(/\/$/, "");
}

/** Public object URL for a path inside the catalog bucket. */
export function catalogPublicUrl(objectPath: string) {
  const base = getSupabaseUrl();
  const clean = objectPath.replace(/^\//, "");
  return `${base}/storage/v1/object/public/${CATALOG_BUCKET}/${clean}`;
}

export function createServiceSupabase(): SupabaseClient {
  const url = getSupabaseUrl();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    "";
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function uploadCatalogObject(
  supabase: SupabaseClient,
  objectPath: string,
  body: Buffer,
  contentType: string,
) {
  const { error } = await supabase.storage
    .from(CATALOG_BUCKET)
    .upload(objectPath, body, {
      contentType,
      upsert: true,
      cacheControl: "31536000",
    });
  if (error) {
    throw new Error(`Upload failed (${objectPath}): ${error.message}`);
  }
  return catalogPublicUrl(objectPath);
}
