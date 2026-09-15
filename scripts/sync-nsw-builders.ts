/**
 * Load the Verify NSW Greater Sydney builder snapshot into nsw_licensed_builders.
 * Usage: npm run sync:nsw-builders
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY. Optional GOOGLE_PLACES_API_KEY to attach ratings.
 */

import { createClient } from "@supabase/supabase-js";
import {
  enrichLicensedBuildersWithGoogle,
  loadNswBuilderSnapshot,
  upsertLicensedBuilders,
} from "../lib/nsw-builders-store";
import type { LicensedBuilderRow } from "../lib/licensed-builders";

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
  const builders = loadNswBuilderSnapshot();
  console.log(`Snapshot: ${builders.length} Greater Sydney contractor-builder licences`);
  const written = await upsertLicensedBuilders(supabase, builders);
  console.log(`Upserted ${written} rows into nsw_licensed_builders`);

  if (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY) {
    const { data, error } = await supabase
      .from("nsw_licensed_builders")
      .select(
        "id, licence_number, licensee, suburb, postcode, state, latitude, longitude, status, expires_on, verify_url, google_rating, google_review_count, google_maps_url, website_url, last_property_sold_address, last_property_sold_at, avg_delay_weeks"
      )
      .is("google_rating", null)
      .not("latitude", "is", null)
      .limit(40);

    if (error) {
      console.warn("Google enrich skipped:", error.message);
      return;
    }

    const rows = (data ?? []).map((row) => ({
      ...row,
      expires: row.expires_on,
    })) as LicensedBuilderRow[];
    const updated = await enrichLicensedBuildersWithGoogle(supabase, rows, 40);
    console.log(`Google Places matched ${updated} builders`);
  } else {
    console.log("Set GOOGLE_PLACES_API_KEY to attach Google ratings/review counts.");
  }
}

main().catch((err) => {
  console.error("✗", err.message ?? err);
  process.exit(1);
});
