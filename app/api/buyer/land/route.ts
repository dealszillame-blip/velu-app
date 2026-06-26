import { NextResponse } from "next/server";
import { z } from "zod";
import { geocodeAddress } from "@/lib/geocoding";
import { notifyBuildersOnSold } from "@/lib/leads/notify-on-sold";
import { buildRequirementsSchema } from "@/lib/buyer-requirements";
import {
  calculateReportPrice,
  type SiteReportDefinition,
  type SiteReportPricingLand,
  type SiteReportRequestStatus,
} from "@/lib/site-reports";
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

type SiteReportRequestRow = {
  id: string;
  report_definition_key: string;
  status: SiteReportRequestStatus;
  buyer_notes: string | null;
  quoted_price: number | null;
  requested_at: string;
  created_at: string;
  updated_at: string;
  site_report_definitions:
    | (SiteReportDefinition & { is_active?: boolean })
    | (SiteReportDefinition & { is_active?: boolean })[]
    | null;
};

function normalizeDefinition(
  definition: SiteReportRequestRow["site_report_definitions"]
) {
  return Array.isArray(definition) ? definition[0] : definition;
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

  const requestedReportKeys = Array.from(
    new Set(body.data.site_report_keys ?? [])
  );
  const siteReportNotes = body.data.site_report_notes?.trim() || null;
  let requestedReportDefinitions: SiteReportDefinition[] = [];

  if (requestedReportKeys.length > 0) {
    const { data: definitions, error: definitionsError } = await supabase
      .from("site_report_definitions")
      .select("key, name, description, price, pricing_rules, sort_order")
      .in("key", requestedReportKeys)
      .eq("is_active", true);

    if (definitionsError) {
      const message = definitionsError.message.includes(
        "site_report_definitions"
      )
        ? "Site report add-ons are not set up yet. Run migration 023_site_report_addons.sql in Supabase."
        : definitionsError.message;
      return NextResponse.json({ error: message }, { status: 500 });
    }

    requestedReportDefinitions = (definitions ?? []) as SiteReportDefinition[];

    if (requestedReportDefinitions.length !== requestedReportKeys.length) {
      return NextResponse.json(
        { error: "One or more selected site reports are unavailable." },
        { status: 400 }
      );
    }
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

  if (listing && requestedReportDefinitions.length > 0) {
    const landForPricing: SiteReportPricingLand = {
      id: listing.id,
      suburb: listing.suburb,
      postcode: listing.postcode,
      land_size_sqm: Number(listing.land_size_sqm),
      frontage_meters: Number(listing.frontage_meters),
      zoning: listing.zoning,
    };
    const reportRows = requestedReportDefinitions.map((report) => ({
      report_definition_key: report.key,
      land_listing_id: listing.id,
      buyer_id: user.id,
      status: "requested" as const,
      buyer_notes: siteReportNotes,
      quoted_price: calculateReportPrice(report, landForPricing),
      pricing_snapshot: {
        report_key: report.key,
        report_price: report.price,
        pricing_rules: report.pricing_rules,
      },
    }));

    const { error: reportError } = await supabase
      .from("site_report_requests")
      .insert(reportRows);

    if (reportError) {
      const message = reportError.message.includes("site_report_requests")
        ? "Site report requests could not be saved. Run migration 023_site_report_addons.sql in Supabase."
        : reportError.message;
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

  const { data: listings, error } = await supabase
    .from("land_listings")
    .select(
      `
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
      builder_proposals (count),
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
    `
    )
    .eq("buyer_id", user.id)
    .eq("source", "buyer_owned")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (listings ?? []).map((row) => {
    const proposals = row.builder_proposals as { count: number }[] | null;
    const siteReportRequests =
      (row.site_report_requests as SiteReportRequestRow[] | null) ?? [];
    return {
      ...row,
      builder_proposals: undefined,
      site_report_requests: undefined,
      proposal_count: proposals?.[0]?.count ?? 0,
      site_reports: siteReportRequests
        .map((request) => {
          const definition = normalizeDefinition(
            request.site_report_definitions
          );

          return {
            id: request.id,
            report_definition_key: request.report_definition_key,
            report_name: definition?.name ?? request.report_definition_key,
            report_description: definition?.description ?? "",
            status: request.status,
            buyer_notes: request.buyer_notes,
            quoted_price: request.quoted_price,
            requested_at: request.requested_at,
            created_at: request.created_at,
            updated_at: request.updated_at,
          };
        })
        .sort((a, b) => a.report_name.localeCompare(b.report_name)),
    };
  });

  return NextResponse.json(rows);
}
