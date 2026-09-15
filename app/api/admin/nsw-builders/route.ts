import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { googlePlacesConfigured } from "@/lib/google-places";
import {
  enrichLicensedBuildersWithGoogle,
  loadNswBuilderSnapshot,
  upsertLicensedBuilders,
} from "@/lib/nsw-builders-store";
import {
  collectNswBuildersForTerms,
  DEFAULT_NSW_SEARCH_TERMS,
} from "@/lib/nsw-register";
import type { LicensedBuilderRow } from "@/lib/licensed-builders";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { count, error } = await auth.admin
    .from("nsw_licensed_builders")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      {
        error: error.message.includes("nsw_licensed_builders")
          ? "Run migration 027_nsw_builder_directory.sql in Supabase."
          : error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    count: count ?? 0,
    google_places_configured: googlePlacesConfigured(),
    snapshot_available: true,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as {
    source?: "snapshot" | "live" | "google";
  };
  const source = body.source ?? "snapshot";

  try {
    if (source === "google") {
      const { data, error } = await auth.admin
        .from("nsw_licensed_builders")
        .select(
          "id, licence_number, licensee, suburb, postcode, state, latitude, longitude, status, expires_on, verify_url, google_rating, google_review_count, google_maps_url, website_url, last_property_sold_address, last_property_sold_at, avg_delay_weeks"
        )
        .is("google_rating", null)
        .not("latitude", "is", null)
        .limit(40);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const rows = (data ?? []).map((row) => ({
        ...row,
        expires: row.expires_on,
      })) as LicensedBuilderRow[];

      const updated = await enrichLicensedBuildersWithGoogle(auth.admin, rows, 40);
      return NextResponse.json({
        ok: true,
        source,
        google_updated: updated,
        google_places_configured: googlePlacesConfigured(),
      });
    }

    const builders =
      source === "live"
        ? await collectNswBuildersForTerms(DEFAULT_NSW_SEARCH_TERMS, {
            maxPages: 2,
            delayMs: 120,
          })
        : loadNswBuilderSnapshot();

    const written = await upsertLicensedBuilders(auth.admin, builders);
    return NextResponse.json({
      ok: true,
      source,
      upserted: written,
      unique: builders.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
