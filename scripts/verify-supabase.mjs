/**
 * Verify Supabase connection and MVP schema.
 * Usage: node --env-file=.env.local scripts/verify-supabase.mjs
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const requiredTables = [
  "profiles",
  "land_listings",
  "builder_profiles",
  "builder_proposals",
  "notifications",
  "feature_flags",
];

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`✓ ${message}`);
}

if (!url || url.includes("your-project")) {
  fail(
    "NEXT_PUBLIC_SUPABASE_URL is missing. Copy .env.example → .env.local and paste your project URL."
  );
}

if (!anonKey || anonKey === "your-anon-key") {
  fail("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.local");
}

const supabase = createClient(url, anonKey);

console.log("\nVelu — Supabase verification\n");
console.log(`Project: ${url}\n`);

const { error: authError } = await supabase.auth.getSession();
if (authError) {
  fail(`Auth check failed: ${authError.message}`);
}
ok("Auth API reachable");

for (const table of requiredTables) {
  const { error } = await supabase.from(table).select("*", { count: "exact", head: true });

  if (error) {
    if (error.code === "42P01") {
      fail(`Table "${table}" not found — run migrations in Supabase SQL Editor (see docs/SUPABASE_SETUP.md)`);
    }
    if (error.code === "PGRST116") {
      ok(`Table "${table}" exists (empty)`);
      continue;
    }
    fail(`Table "${table}": ${error.message}`);
  }

  ok(`Table "${table}" exists`);
}

// feature_flags RLS requires auth — verify with service role when available
const hasServiceKey =
  serviceKey &&
  serviceKey !== "your-service-role-key" &&
  serviceKey !== anonKey;

if (!hasServiceKey) {
  console.warn(
    "⚠ SUPABASE_SERVICE_ROLE_KEY missing or same as anon key — skipping feature_flags + RPC checks"
  );
  console.warn(
    "  Copy the service_role secret from Supabase → Project Settings → API"
  );
} else {
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: flags, error: flagsError } = await admin
    .from("feature_flags")
    .select("key, enabled");

  if (flagsError) {
    fail(`feature_flags query failed: ${flagsError.message}`);
  }

  if (!flags?.length) {
    fail("feature_flags is empty — run 005_feature_flags.sql");
  }

  ok(`Feature flags loaded (${flags.length} rows)`);

  const { error: rpcError } = await admin.rpc("get_builders_near_listing", {
    p_listing_id: "00000000-0000-0000-0000-000000000000",
  });

  if (rpcError && !rpcError.message.includes("0 rows")) {
    console.warn(`⚠ RPC get_builders_near_listing: ${rpcError.message}`);
  } else {
    ok("RPC get_builders_near_listing callable (service role)");
  }
}

console.log("\n✓ Supabase is configured correctly. Run: npm run dev\n");
