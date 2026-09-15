import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { googlePlacesConfigured } from "@/lib/google-places";
import {
  asLicensedBuilderRow,
  enrichLicensedBuildersWithGoogle,
  LICENSED_BUILDER_COLUMNS,
  loadNswBuilderSnapshot,
  upsertLicensedBuilders,
} from "@/lib/nsw-builders-store";
import {
  getNswBuilderDirectoryStats,
  runWeeklyBuilderUpdate,
} from "@/lib/nsw-builders-weekly";
import {
  collectNswBuildersForTerms,
  DEFAULT_NSW_SEARCH_TERMS,
} from "@/lib/nsw-register";

export const maxDuration = 60;

function directoryError(message: string) {
  return NextResponse.json(
    {
      error: message.includes("nsw_licensed_builders")
        ? "Run migration 027_nsw_builder_directory.sql in Supabase."
        : message,
    },
    { status: 500 }
  );
}

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const stats = await getNswBuilderDirectoryStats(auth.admin);
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load directory";
    return directoryError(message);
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as {
    source?: "snapshot" | "live" | "google" | "weekly";
  };
  const source = body.source ?? "snapshot";

  try {
    if (source === "weekly") {
      const result = await runWeeklyBuilderUpdate(auth.admin, { mode: "admin" });
      return NextResponse.json(result);
    }

    if (source === "google") {
      const { data, error } = await auth.admin
        .from("nsw_licensed_builders")
        .select(LICENSED_BUILDER_COLUMNS)
        .is("google_rating", null)
        .not("latitude", "is", null)
        .limit(40);

      if (error) {
        return directoryError(error.message);
      }

      const updated = await enrichLicensedBuildersWithGoogle(
        auth.admin,
        (data ?? []).map(asLicensedBuilderRow),
        40
      );
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
    return directoryError(message);
  }
}
