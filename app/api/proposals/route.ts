import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { nswVerifyUrl } from "@/lib/placeholder-builders";
import { createProposalSchema } from "@/lib/proposal-schema";
import { defaultLineKind } from "@/lib/quote-structure";
import { isSoilReportDelivered } from "@/lib/soil-sequencing";
import { createClient } from "@/lib/supabase/server";
import type { ProposalRow } from "@/lib/proposals";
import type { SiteReportRequestStatus } from "@/lib/site-reports";

function normalizeBreakdown(
  lines: Array<{
    category: string;
    label: string;
    amount: number;
    note?: string;
    line_kind?: "lump_sum" | "pc" | "ps" | "allowance";
    provisional?: boolean;
  }> | undefined
) {
  return (lines ?? []).map((line) => ({
    ...line,
    line_kind: line.line_kind ?? defaultLineKind(line.category),
    provisional:
      line.provisional ?? (line.category === "site" ? true : undefined),
  }));
}

async function attachSoilFlags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: ProposalRow[]
) {
  const listingIds = [
    ...new Set(rows.map((row) => row.land_listing_id).filter(Boolean)),
  ];
  if (listingIds.length === 0) return rows;

  const { data: soils } = await supabase
    .from("site_report_requests")
    .select("land_listing_id, report_definition_key, status")
    .eq("report_definition_key", "soil_report")
    .in("land_listing_id", listingIds);

  const byListing = new Map(
    (soils ?? []).map((row) => [
      row.land_listing_id as string,
      row.status as SiteReportRequestStatus,
    ])
  );

  return rows.map((row) => {
    const status = byListing.get(row.land_listing_id) ?? null;
    return {
      ...row,
      soil_report_status: status,
      site_costs_provisional: !isSoilReportDelivered(
        soils ?? [],
        row.land_listing_id
      ),
    };
  });
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

  if (profile?.role !== "builder") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: builderProfile } = await supabase
    .from("builder_profiles")
    .select("is_onboarded")
    .eq("id", user.id)
    .single();

  if (!builderProfile?.is_onboarded) {
    return NextResponse.json(
      { error: "Complete onboarding before submitting proposals." },
      { status: 403 }
    );
  }

  const body = createProposalSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { data: listing } = await supabase
    .from("land_listings")
    .select("id, status, buyer_id")
    .eq("id", body.data.land_listing_id)
    .single();

  if (!listing || listing.status !== "sold") {
    return NextResponse.json(
      { error: "Proposals can only be submitted on sold listings." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("builder_proposals")
    .insert({
      builder_id: user.id,
      land_listing_id: body.data.land_listing_id,
      buyer_id: listing.buyer_id,
      package_name: body.data.package_name,
      base_price: body.data.base_price,
      contract_type: body.data.contract_type,
      inclusions: body.data.inclusions ?? null,
      estimated_build_weeks: body.data.estimated_build_weeks ?? null,
      notes: body.data.notes ?? null,
      price_breakdown: normalizeBreakdown(body.data.price_breakdown),
      inclusion_items: body.data.inclusion_items ?? [],
      home_specs: body.data.home_specs ?? {},
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error:
            "You already have a live proposal for this listing. Edit or withdraw it first.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (listing.buyer_id) {
    const admin = await createServiceClient();
    await admin.from("notifications").insert({
      recipient_id: listing.buyer_id,
      type: "proposal_received",
      title: "New builder proposal",
      body: `${body.data.package_name} — ${new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(body.data.base_price)}`,
      metadata: {
        proposal_id: data.id,
        listing_id: listing.id,
      },
    });
  }

  return NextResponse.json({ id: data.id });
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

  if (!profile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (profile.role === "buyer") {
    const { data, error } = await supabase.rpc("get_proposals_for_buyer", {
      p_buyer_id: user.id,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const rows = (Array.isArray(data) ? data : []) as Array<
      ProposalRow & {
        license_number?: string | null;
        license_verify_url?: string | null;
        is_license_valid?: boolean | null;
        insurance_verified?: boolean | null;
      }
    >;
    const missing = rows
      .filter((row) => row.license_number == null)
      .map((row) => row.builder_id);
    if (missing.length > 0) {
      const { data: profiles } = await supabase
        .from("builder_profiles")
        .select("id, license_number, license_verify_url, is_license_valid, insurance_verified")
        .in("id", [...new Set(missing)]);
      const byId = new Map(
        (profiles ?? []).map((profileRow) => [profileRow.id, profileRow])
      );
      for (const row of rows) {
        const extra = byId.get(row.builder_id);
        if (!extra) continue;
        row.license_number = extra.license_number;
        row.license_verify_url = nswVerifyUrl(
          extra.license_number,
          extra.license_verify_url
        );
        row.is_license_valid = extra.is_license_valid;
        row.insurance_verified = extra.insurance_verified;
      }
    } else {
      for (const row of rows) {
        row.license_verify_url = nswVerifyUrl(
          row.license_number,
          row.license_verify_url
        );
      }
    }
    const withSoil = await attachSoilFlags(supabase, rows);
    return NextResponse.json(withSoil);
  }

  if (profile.role === "builder") {
    const { data, error } = await supabase
      .from("builder_proposals")
      .select(
        `
        id,
        land_listing_id,
        package_name,
        base_price,
        contract_type,
        inclusions,
        estimated_build_weeks,
        notes,
        price_breakdown,
        inclusion_items,
        home_specs,
        status,
        created_at,
        land_listings (address, suburb, postcode)
      `
      )
      .eq("builder_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
