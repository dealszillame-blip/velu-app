/**
 * Weekly NSW builder directory update: Verify NSW licence recheck + Google Places reviews.
 * Used by Vercel Cron, GitHub Actions, CLI, and Admin → Data.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { googlePlacesConfigured } from "@/lib/google-places";
import {
  asLicensedBuilderRow,
  LICENSED_BUILDER_COLUMNS,
  refreshLicensedBuildersGoogleReviews,
  upsertLicensedBuilders,
} from "@/lib/nsw-builders-store";
import {
  collectNswBuildersForTerms,
  DEFAULT_NSW_SEARCH_TERMS,
  lookupNswLicence,
} from "@/lib/nsw-register";

export type WeeklyBuilderUpdateMode = "cron" | "admin" | "full";

export type WeeklyBuilderUpdateResult = {
  ok: true;
  mode: WeeklyBuilderUpdateMode;
  started_at: string;
  finished_at: string;
  discovered: number;
  upserted: number;
  licences_checked: number;
  licences_not_found: number;
  licences_status_changed: number;
  licences_errors: number;
  google_checked: number;
  google_refreshed: number;
  google_missed: number;
  google_errors: number;
  google_places_configured: boolean;
};

const CRON_SEARCH_TERMS = [
  "Oran Park",
  "Campbelltown",
  "Leppington",
  "Narellan",
  "Gregory Hills",
  "Liverpool",
  "Camden",
  "Dhursan",
];

const PRESETS: Record<
  WeeklyBuilderUpdateMode,
  {
    collectTerms: string[];
    maxPages: number;
    delayMs: number;
    licenceRecheck: number;
    googleRefresh: number;
  }
> = {
  cron: {
    collectTerms: CRON_SEARCH_TERMS,
    maxPages: 1,
    delayMs: 80,
    licenceRecheck: 25,
    googleRefresh: 8,
  },
  admin: {
    collectTerms: DEFAULT_NSW_SEARCH_TERMS,
    maxPages: 1,
    delayMs: 100,
    licenceRecheck: 40,
    googleRefresh: 20,
  },
  full: {
    collectTerms: DEFAULT_NSW_SEARCH_TERMS,
    maxPages: 2,
    delayMs: 120,
    licenceRecheck: 400,
    googleRefresh: 150,
  },
};

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runWeeklyBuilderUpdate(
  admin: SupabaseClient,
  options?: { mode?: WeeklyBuilderUpdateMode }
): Promise<WeeklyBuilderUpdateResult> {
  const mode = options?.mode ?? "full";
  const preset = PRESETS[mode];
  const licenceLimit = envInt(
    "WEEKLY_LICENCE_RECHECK_LIMIT",
    preset.licenceRecheck
  );
  const googleLimit = envInt(
    "WEEKLY_GOOGLE_REFRESH_LIMIT",
    preset.googleRefresh
  );
  const started_at = new Date().toISOString();

  const discovered = await collectNswBuildersForTerms(preset.collectTerms, {
    maxPages: preset.maxPages,
    delayMs: preset.delayMs,
  });
  const upserted = await upsertLicensedBuilders(admin, discovered);

  const { data: staleLicences, error: licenceError } = await admin
    .from("nsw_licensed_builders")
    .select("id, licence_number, nsw_licence_id, status, expires_on")
    .order("last_synced_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(licenceLimit);

  if (licenceError) {
    throw new Error(licenceError.message);
  }

  let licences_checked = 0;
  let licences_not_found = 0;
  let licences_status_changed = 0;
  let licences_errors = 0;

  for (const row of staleLicences ?? []) {
    licences_checked += 1;
    try {
      const found = await lookupNswLicence(
        row.licence_number,
        row.nsw_licence_id
      );
      if (!found) {
        if (row.status !== "Not found") {
          licences_status_changed += 1;
        }
        const { error } = await admin
          .from("nsw_licensed_builders")
          .update({
            status: "Not found",
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        if (error) throw new Error(error.message);
        licences_not_found += 1;
      } else {
        if (
          (found.status ?? "Current") !== (row.status ?? "Current") ||
          (found.expires ?? null) !== (row.expires_on ?? null)
        ) {
          licences_status_changed += 1;
        }
        await upsertLicensedBuilders(admin, [found]);
      }
    } catch {
      licences_errors += 1;
    }
    if (preset.delayMs) await sleep(preset.delayMs);
  }

  let google_checked = 0;
  let google_refreshed = 0;
  let google_missed = 0;
  let google_errors = 0;
  const googleConfigured = googlePlacesConfigured();

  if (googleConfigured && googleLimit > 0) {
    const { data: googleRows, error: googleError } = await admin
      .from("nsw_licensed_builders")
      .select(LICENSED_BUILDER_COLUMNS)
      .not("latitude", "is", null)
      .order("google_synced_at", { ascending: true, nullsFirst: true })
      .order("id", { ascending: true })
      .limit(googleLimit);

    if (googleError) {
      throw new Error(googleError.message);
    }

    const rows = (googleRows ?? []).map(asLicensedBuilderRow);
    const googleResult = await refreshLicensedBuildersGoogleReviews(
      admin,
      rows,
      googleLimit
    );
    google_checked = googleResult.checked;
    google_refreshed = googleResult.updated;
    google_missed = googleResult.missed;
    google_errors = googleResult.errors;
  }

  return {
    ok: true,
    mode,
    started_at,
    finished_at: new Date().toISOString(),
    discovered: discovered.length,
    upserted,
    licences_checked,
    licences_not_found,
    licences_status_changed,
    licences_errors,
    google_checked,
    google_refreshed,
    google_missed,
    google_errors,
    google_places_configured: googleConfigured,
  };
}

export async function getNswBuilderDirectoryStats(admin: SupabaseClient) {
  const { count, error } = await admin
    .from("nsw_licensed_builders")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message);
  }

  const { count: currentCount } = await admin
    .from("nsw_licensed_builders")
    .select("id", { count: "exact", head: true })
    .eq("status", "Current");

  const { data: latestLicence } = await admin
    .from("nsw_licensed_builders")
    .select("last_synced_at")
    .order("last_synced_at", { ascending: false })
    .limit(1);

  const { data: latestGoogle } = await admin
    .from("nsw_licensed_builders")
    .select("google_synced_at")
    .not("google_synced_at", "is", null)
    .order("google_synced_at", { ascending: false })
    .limit(1);

  return {
    count: count ?? 0,
    current_count: currentCount ?? 0,
    last_licence_check_at: latestLicence?.[0]?.last_synced_at ?? null,
    last_google_sync_at: latestGoogle?.[0]?.google_synced_at ?? null,
    google_places_configured: googlePlacesConfigured(),
    snapshot_available: true,
  };
}
