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

export const LICENSED_BUILDER_COLUMNS =
  "id, licence_number, licensee, suburb, postcode, state, latitude, longitude, status, expires_on, verify_url, google_rating, google_review_count, google_maps_url, website_url, last_property_sold_address, last_property_sold_at, avg_delay_weeks";

export function asLicensedBuilderRow(row: {
  expires_on?: string | null;
  [key: string]: unknown;
}): LicensedBuilderRow {
  return {
    ...row,
    expires: row.expires_on ?? null,
  } as LicensedBuilderRow;
}

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

async function writeGooglePlace(
  admin: SupabaseClient,
  row: LicensedBuilderRow,
  place: {
    place_id: string | null;
    rating: number | null;
    review_count: number | null;
    maps_url: string | null;
    website_url: string | null;
  } | null
): Promise<boolean> {
  const payload = place
    ? {
        google_place_id: place.place_id,
        google_rating: place.rating,
        google_review_count: place.review_count,
        google_maps_url: place.maps_url,
        website_url: place.website_url,
        google_synced_at: new Date().toISOString(),
      }
    : { google_synced_at: new Date().toISOString() };

  const { error } = await admin
    .from("nsw_licensed_builders")
    .update(payload)
    .eq("id", row.id);

  if (error) return false;
  if (place) {
    row.google_rating = place.rating;
    row.google_review_count = place.review_count;
    row.google_maps_url = place.maps_url;
  }
  return true;
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
    if (await writeGooglePlace(admin, row, place)) {
      updated += 1;
    }
  }

  return updated;
}

export async function refreshLicensedBuildersGoogleReviews(
  admin: SupabaseClient,
  rows: LicensedBuilderRow[],
  limit = 8
): Promise<{ checked: number; updated: number; missed: number; errors: number }> {
  const pending = rows.slice(0, limit);
  let updated = 0;
  let missed = 0;
  let errors = 0;

  for (const row of pending) {
    try {
      const place = await lookupGooglePlaceRating(
        googleBuilderQuery(row.licensee, row.suburb, row.postcode),
        row.latitude != null && row.longitude != null
          ? { latitude: row.latitude, longitude: row.longitude }
          : undefined
      );
      const matched = Boolean(place && (place.rating != null || place.place_id));
      if (await writeGooglePlace(admin, row, matched && place ? place : null)) {
        if (matched) updated += 1;
        else missed += 1;
      } else {
        errors += 1;
      }
    } catch {
      errors += 1;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { checked: pending.length, updated, missed, errors };
}
