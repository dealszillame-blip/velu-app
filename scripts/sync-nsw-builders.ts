/**
 * Load the Verify NSW Greater Sydney builder snapshot, or run the weekly
 * licence + Google review update.
 *
 * These commands belong in a terminal (or Admin → Data), not the Supabase SQL Editor.
 *
 * Usage:
 *   npm run sync:nsw-builders
 *   npm run sync:nsw-builders:weekly
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY. Optional GOOGLE_PLACES_API_KEY.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  asLicensedBuilderRow,
  enrichLicensedBuildersWithGoogle,
  LICENSED_BUILDER_COLUMNS,
  loadNswBuilderSnapshot,
  upsertLicensedBuilders,
} from "../lib/nsw-builders-store";
import { runWeeklyBuilderUpdate } from "../lib/nsw-builders-weekly";

function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  if (process.argv.includes("--weekly")) {
    const result = await runWeeklyBuilderUpdate(supabase, { mode: "full" });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const builders = loadNswBuilderSnapshot();
  console.log(`Snapshot: ${builders.length} Greater Sydney contractor-builder licences`);
  const written = await upsertLicensedBuilders(supabase, builders);
  console.log(`Upserted ${written} rows into nsw_licensed_builders`);

  if (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY) {
    const { data, error } = await supabase
      .from("nsw_licensed_builders")
      .select(LICENSED_BUILDER_COLUMNS)
      .is("google_rating", null)
      .not("latitude", "is", null)
      .limit(40);

    if (error) {
      console.warn("Google enrich skipped:", error.message);
      return;
    }

    const updated = await enrichLicensedBuildersWithGoogle(
      supabase,
      (data ?? []).map(asLicensedBuilderRow),
      40
    );
    console.log(`Google Places matched ${updated} builders`);
  } else {
    console.log("Set GOOGLE_PLACES_API_KEY to attach Google ratings/review counts.");
  }
}

main().catch((err) => {
  console.error("✗", err.message ?? err);
  process.exit(1);
});
