import { NextResponse } from "next/server";
import { z } from "zod";
import { geocodeAddress } from "@/lib/geocoding";
import { notifyBuildersOnSold } from "@/lib/leads/notify-on-sold";
import { buildRequirementsSchema } from "@/lib/buyer-requirements";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  address: z.string().min(5),
  land_size_sqm: z.number().positive(),
  frontage_meters: z.number().positive(),
  zoning: z.string().min(2).max(10),
  land_value: z.number().min(0).optional(),
  build_requirements: buildRequirementsSchema,
});

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
    .select("id, land_size_sqm, suburb, postcode, source")
    .eq("id", listingId)
    .single();

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
      builder_proposals (count)
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
    return {
      ...row,
      builder_proposals: undefined,
      proposal_count: proposals?.[0]?.count ?? 0,
    };
  });

  return NextResponse.json(rows);
}
