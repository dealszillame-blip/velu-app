import { NextResponse } from "next/server";
import { z } from "zod";
import { geocodeAddress } from "@/lib/geocoding";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  address: z.string().min(5),
  price: z.number().positive(),
  land_size_sqm: z.number().positive(),
  frontage_meters: z.number().positive(),
  zoning: z.string().min(2).max(10),
  status: z.enum(["available", "under_offer", "sold"]).default("available"),
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

  if (profile?.role !== "agent") {
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

  const { data: listingId, error } = await supabase.rpc("create_land_listing", {
    p_agent_id: user.id,
    p_address: geocoded.address,
    p_suburb: geocoded.suburb || geocoded.placeName.split(",")[1]?.trim() || "Unknown",
    p_postcode: geocoded.postcode.slice(0, 4),
    p_price: body.data.price,
    p_land_size_sqm: body.data.land_size_sqm,
    p_frontage_meters: body.data.frontage_meters,
    p_zoning: body.data.zoning.toUpperCase(),
    p_longitude: geocoded.longitude,
    p_latitude: geocoded.latitude,
    p_status: body.data.status,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: listingId });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_listings_for_map", {
    p_status: searchParams.get("status") || "available",
    p_price_min: searchParams.get("priceMin")
      ? Number(searchParams.get("priceMin"))
      : null,
    p_price_max: searchParams.get("priceMax")
      ? Number(searchParams.get("priceMax"))
      : null,
    p_size_min: searchParams.get("sizeMin")
      ? Number(searchParams.get("sizeMin"))
      : null,
    p_size_max: searchParams.get("sizeMax")
      ? Number(searchParams.get("sizeMax"))
      : null,
    p_suburb: searchParams.get("suburb") || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
