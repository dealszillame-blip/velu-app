import { NextResponse } from "next/server";
import { z } from "zod";
import { createSiteReportRequests } from "@/lib/site-reports/server";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  site_report_keys: z.array(z.string().min(1).max(64)).min(1).max(10),
  site_report_notes: z.string().max(1000).optional(),
});

type RouteContext = { params: Promise<{ listingId: string }> };

export async function POST(
  request: Request,
  context: RouteContext
) {
  const { listingId } = await context.params;
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

  const { data: listing, error: listingError } = await supabase
    .from("land_listings")
    .select(
      "id, suburb, postcode, land_size_sqm, frontage_meters, zoning, buyer_id, source"
    )
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Land not found." }, { status: 404 });
  }

  if (listing.buyer_id !== user.id || listing.source !== "buyer_owned") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await createSiteReportRequests({
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
      reportKeys: body.data.site_report_keys,
      buyerNotes: body.data.site_report_notes,
    });

    return NextResponse.json({ ok: true, created: result.created });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to request site reports.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
