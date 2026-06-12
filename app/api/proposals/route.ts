import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const breakdownLineSchema = z.object({
  category: z.string(),
  label: z.string().min(1),
  amount: z.number().min(0),
  note: z.string().optional(),
});

const inclusionItemSchema = z.object({
  category: z.string(),
  item: z.string().min(1),
  detail: z.string(),
  included: z.boolean(),
});

const homeSpecsSchema = z.object({
  bedrooms: z.number().int().positive().optional(),
  bathrooms: z.number().positive().optional(),
  car_spaces: z.number().int().min(0).optional(),
  living_area_sqm: z.number().positive().optional(),
  storeys: z.number().int().positive().optional(),
});

const createSchema = z.object({
  land_listing_id: z.string().uuid(),
  package_name: z.string().min(2),
  base_price: z.number().positive(),
  inclusions: z.string().optional(),
  estimated_build_weeks: z.number().int().positive().optional(),
  notes: z.string().optional(),
  price_breakdown: z.array(breakdownLineSchema).optional(),
  inclusion_items: z.array(inclusionItemSchema).optional(),
  home_specs: homeSpecsSchema.optional(),
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

  const body = createSchema.safeParse(await request.json());
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
      inclusions: body.data.inclusions ?? null,
      estimated_build_weeks: body.data.estimated_build_weeks ?? null,
      notes: body.data.notes ?? null,
      price_breakdown: body.data.price_breakdown ?? [],
      inclusion_items: body.data.inclusion_items ?? [],
      home_specs: body.data.home_specs ?? {},
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You already submitted a proposal for this listing." },
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

export async function GET(request: Request) {
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
    return NextResponse.json(data ?? []);
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
