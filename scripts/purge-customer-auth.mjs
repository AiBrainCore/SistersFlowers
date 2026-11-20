#!/usr/bin/env node
/**
 * Delete a shop customer from Prisma + Supabase Auth so they can re-register.
 *
 *   node --env-file=secrets/supabase-service.env --env-file=.env.local \
 *     scripts/purge-customer-auth.mjs butchi0603@gmail.com
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const email = String(process.argv[2] || "")
  .trim()
  .toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/purge-customer-auth.mjs email@example.com");
  process.exit(1);
}

const url = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  ""
).trim();
const key = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  ""
).trim();
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const prisma = new PrismaClient();
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findAuthUserId() {
  // Paginate admin users until email match (Auth has no get-by-email helper).
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) return hit.id;
    if (!data.users.length || data.users.length < 200) return null;
    page += 1;
    if (page > 50) return null;
  }
}

async function main() {
  const customers = await prisma.customer.findMany({
    where: { email },
    select: { id: true, authUserId: true, email: true },
  });
  console.log(`Prisma customers matching ${email}: ${customers.length}`);

  for (const row of customers) {
    await prisma.customer.delete({ where: { id: row.id } });
    console.log(`Deleted prisma customer ${row.id}`);
  }

  const authId =
    customers.map((c) => c.authUserId).find(Boolean) || (await findAuthUserId());
  if (authId) {
    const { error } = await admin.auth.admin.deleteUser(authId);
    if (error) {
      console.error(`Supabase Auth delete failed: ${error.message}`);
      process.exitCode = 2;
    } else {
      console.log(`Deleted Supabase Auth user ${authId}`);
    }
  } else {
    // Try email search again in case prisma had no authUserId
    const again = await findAuthUserId();
    if (again) {
      const { error } = await admin.auth.admin.deleteUser(again);
      if (error) {
        console.error(`Supabase Auth delete failed: ${error.message}`);
        process.exitCode = 2;
      } else {
        console.log(`Deleted Supabase Auth user ${again}`);
      }
    } else {
      console.log("No Supabase Auth user found for that email");
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
