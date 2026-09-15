import type { SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { gunzipSync } from "zlib";
import { join } from "path";
import {
  googleBuilderQuery,
  lookupGooglePlaceRating,
} from "@/lib/google-places";
import { nswRegisterToUpsert, type LicensedBuilderRow } from "@/lib/licensed-builders";
import type { NswRegisterBuilder } from "@/lib/nsw-register";

const SNAPSHOT = join(
  process.cwd(),
  "scripts/data/nsw-sydney-builders.json.gz"
);

export async function upsertLicensedBuilders(
  admin: SupabaseClient,
  builders: NswRegisterBuilder[]
): Promise<number> {
  let written = 0;
  const chunkSize = 200;

  for (let i = 0; i < builders.length; i += chunkSize) {
    const chunk = builders.slice(i, i + chunkSize).map(nswRegisterToUpsert);
    const { error } = await admin.from("nsw_licensed_builders").upsert(chunk, {
      onConflict: "licence_number",
    });
    if (error) {
      throw new Error(error.message);
    }
    written += chunk.length;
  }

  return written;
}

export function loadNswBuilderSnapshot(): NswRegisterBuilder[] {
  const raw = gunzipSync(readFileSync(SNAPSHOT));
  const parsed = JSON.parse(raw.toString("utf8")) as {
    builders?: NswRegisterBuilder[];
  };
  return parsed.builders ?? [];
}

export async function enrichLicensedBuildersWithGoogle(
  admin: SupabaseClient,
  rows: LicensedBuilderRow[],
  limit = 8
): Promise<number> {
  const pending = rows
    .filter((row) => row.google_rating == null)
    .slice(0, limit);

  let updated = 0;
  for (const row of pending) {
    const place = await lookupGooglePlaceRating(
      googleBuilderQuery(row.licensee, row.suburb, row.postcode),
      row.latitude != null && row.longitude != null
        ? { latitude: row.latitude, longitude: row.longitude }
        : undefined
    );
    if (!place || (place.rating == null && !place.place_id)) continue;

    const { error } = await admin
      .from("nsw_licensed_builders")
      .update({
        google_place_id: place.place_id,
        google_rating: place.rating,
        google_review_count: place.review_count,
        google_maps_url: place.maps_url,
        website_url: place.website_url,
        google_synced_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (!error) {
      row.google_rating = place.rating;
      row.google_review_count = place.review_count;
      row.google_maps_url = place.maps_url;
      updated += 1;
    }
  }

  return updated;
}
