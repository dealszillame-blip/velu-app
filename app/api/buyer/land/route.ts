import { NextResponse } from "next/server";
import { z } from "zod";
import { geocodeAddress } from "@/lib/geocoding";
import { notifyBuildersOnSold } from "@/lib/leads/notify-on-sold";
import { buildRequirementsSchema } from "@/lib/buyer-requirements";
import { isSiteReportsSchemaError } from "@/lib/site-reports";
import {
  createSiteReportRequests,
  mapSiteReportRequests,
} from "@/lib/site-reports/server";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  address: z.string().min(5),
  land_size_sqm: z.number().positive(),
  frontage_meters: z.number().positive(),
  zoning: z.string().min(2).max(10),
  land_value: z.number().min(0).optional(),
  build_requirements: buildRequirementsSchema,
  site_report_keys: z.array(z.string().min(1).max(64)).max(10).optional(),
  site_report_notes: z.string().max(1000).optional(),
});

const LISTING_SELECT = `
  id,
  address,
  suburb,
  postcode,
  land_size_sqm,
  frontage_meters,
  zoning,
  price,
  price_display,
  status,
  source,
  sold_at,
  created_at,
  builder_proposals (count)
`;

const LISTING_SELECT_WITH_REPORTS = `
  ${LISTING_SELECT},
  site_report_requests (
    id,
    report_definition_key,
    status,
    buyer_notes,
    quoted_price,
    requested_at,
    created_at,
    updated_at,
    site_report_definitions (
      key,
      name,
      description,
      price,
      pricing_rules,
      sort_order
    )
  )
`;

function mapListingRow(row: Record<string, unknown>) {
  const proposals = row.builder_proposals as { count: number }[] | null;
  const siteReportRequests = row.site_report_requests as Parameters<
    typeof mapSiteReportRequests
  >[0];

  return {
    ...row,
    builder_proposals: undefined,
    site_report_requests: undefined,
    proposal_count: proposals?.[0]?.count ?? 0,
    site_reports: mapSiteReportRequests(siteReportRequests),
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "buyer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const geocoded = await geocodeAddress(body.data.address);
  if (!geocoded) {
    return NextResponse.json(
      {
        error:
          "Could not geocode address. Try a full NSW address with suburb and postcode.",
      },
      { status: 422 }
    );
  }

  if (!geocoded.postcode) {
    return NextResponse.json(
      { error: "Address must include a valid NSW postcode." },
      { status: 422 }
    );
  }

  const { error: buyerProfileError } = await supabase.from("buyer_profiles").upsert({
    id: user.id,
    build_requirements: body.data.build_requirements,
    requirements_completed_at: new Date().toISOString(),
  });

  if (buyerProfileError) {
    const message = buyerProfileError.message.includes("buyer_profiles")
      ? "Build requirements storage is not set up yet. Run migration 019_buyer_build_requirements.sql in Supabase."
      : buyerProfileError.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: listingId, error } = await supabase.rpc(
    "create_buyer_owned_listing",
    {
      p_buyer_id: user.id,
      p_address: geocoded.address,
      p_suburb:
        geocoded.suburb ||
        geocoded.placeName.split(",")[1]?.trim() ||
        "Unknown",
      p_postcode: geocoded.postcode.slice(0, 4),
      p_land_size_sqm: body.data.land_size_sqm,
      p_frontage_meters: body.data.frontage_meters,
      p_zoning: body.data.zoning.toUpperCase(),
      p_longitude: geocoded.longitude,
      p_latitude: geocoded.latitude,
      p_land_value: body.data.land_value ?? 0,
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: listing } = await supabase
    .from("land_listings")
    .select(
      "id, land_size_sqm, frontage_meters, zoning, suburb, postcode, source"
    )
    .eq("id", listingId)
    .single();

  if (listing && (body.data.site_report_keys?.length ?? 0) > 0) {
    try {
      await createSiteReportRequests({
        supabase,
        buyerId: user.id,
        listing: {
          id: listing.id,
          suburb: listing.suburb,
          postcode: listing.postcode,
          land_size_sqm: Number(listing.land_size_sqm),
          frontage_meters: Number(listing.frontage_meters),
          zoning: listing.zoning,
        },
        reportKeys: body.data.site_report_keys ?? [],
        buyerNotes: body.data.site_report_notes,
      });
    } catch (reportError) {
      const message =
        reportError instanceof Error
          ? reportError.message
          : "Site report requests could not be saved.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (listing) {
    await notifyBuildersOnSold({
      id: listing.id,
      land_size_sqm: listing.land_size_sqm,
      suburb: listing.suburb,
      postcode: listing.postcode,
      source: listing.source ?? "buyer_owned",
    });
  }

  return NextResponse.json({ id: listingId });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "buyer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const withReports = await supabase
    .from("land_listings")
    .select(LISTING_SELECT_WITH_REPORTS)
    .eq("buyer_id", user.id)
    .eq("source", "buyer_owned")
    .order("created_at", { ascending: false });

  if (!withReports.error) {
    return NextResponse.json((withReports.data ?? []).map(mapListingRow));
  }

  if (!isSiteReportsSchemaError(withReports.error.message)) {
    return NextResponse.json(
      { error: withReports.error.message },
      { status: 500 }
    );
  }

  const withoutReports = await supabase
    .from("land_listings")
    .select(LISTING_SELECT)
    .eq("buyer_id", user.id)
    .eq("source", "buyer_owned")
    .order("created_at", { ascending: false });

  if (withoutReports.error) {
    return NextResponse.json(
      { error: withoutReports.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    (withoutReports.data ?? []).map((row) => ({
      ...mapListingRow(row),
      site_reports: [],
    }))
  );
}
