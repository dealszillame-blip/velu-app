import { NextResponse } from "next/server";
import { z } from "zod";
import { geocodeAddress } from "@/lib/geocoding";
import { requireAdminApi } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  agent_id: z.string().uuid().nullable().optional(),
  address: z.string().min(5),
  price: z.number().positive(),
  land_size_sqm: z.number().positive(),
  frontage_meters: z.number().positive(),
  zoning: z.string().min(2).max(10),
  status: z.enum(["available", "under_offer", "sold"]).default("available"),
});

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.admin
    .from("land_listings")
    .select(
      "id, address, suburb, postcode, price, land_size_sqm, frontage_meters, zoning, status, source, buyer_id, agent_id, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = postSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (body.data.agent_id) {
    const { data: agent } = await auth.admin
      .from("profiles")
      .select("role")
      .eq("id", body.data.agent_id)
      .single();

    if (!agent || (agent.role !== "agent" && agent.role !== "pending_agent")) {
      return NextResponse.json(
        { error: "Selected user is not an agent." },
        { status: 400 }
      );
    }
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

  const suburb =
    geocoded.suburb ||
    geocoded.placeName.split(",")[1]?.trim() ||
    "Unknown";
  const postcode = geocoded.postcode.slice(0, 4);
  const zoning = body.data.zoning.toUpperCase();

  if (body.data.agent_id) {
    const { data: listingId, error } = await auth.admin.rpc(
      "create_land_listing",
      {
        p_agent_id: body.data.agent_id,
        p_address: geocoded.address,
        p_suburb: suburb,
        p_postcode: postcode,
        p_price: body.data.price,
        p_land_size_sqm: body.data.land_size_sqm,
        p_frontage_meters: body.data.frontage_meters,
        p_zoning: zoning,
        p_longitude: geocoded.longitude,
        p_latitude: geocoded.latitude,
        p_status: body.data.status,
      }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: listingId });
  }

  const { data, error } = await auth.admin
    .from("land_listings")
    .insert({
      address: geocoded.address,
      suburb,
      postcode,
      price: body.data.price,
      land_size_sqm: body.data.land_size_sqm,
      frontage_meters: body.data.frontage_meters,
      zoning,
      status: body.data.status,
      source: "agent",
      geom: `SRID=4326;POINT(${geocoded.longitude} ${geocoded.latitude})`,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
