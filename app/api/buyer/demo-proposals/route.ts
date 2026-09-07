import { NextResponse } from "next/server";
import { DEMO_COMPARISON_TEMPLATES } from "@/lib/demo-proposals";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
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

  const { data: listings, error: listingError } = await supabase
    .from("land_listings")
    .select("id, address, suburb")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (listingError) {
    return NextResponse.json({ error: listingError.message }, { status: 500 });
  }

  if (!listings?.length) {
    return NextResponse.json(
      { error: "Register a block under My land first, then load demonstration packages." },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = await createServiceClient();
  } catch {
    return NextResponse.json(
      {
        error:
          "Demo seeding needs SUPABASE_SERVICE_ROLE_KEY. Run migrations/mvp/025_demo_comparison_proposals.sql in Supabase instead.",
      },
      { status: 503 }
    );
  }

  const { data: builders, error: builderError } = await admin
    .from("builder_profiles")
    .select("id")
    .eq("is_onboarded", true)
    .limit(6);

  if (builderError) {
    return NextResponse.json({ error: builderError.message }, { status: 500 });
  }

  const builderIds = (builders ?? []).map((row) => row.id).filter(Boolean);
  if (builderIds.length === 0) {
    return NextResponse.json(
      { error: "No onboarded builders are available to attach demonstration packages." },
      { status: 400 }
    );
  }

  const listing = listings[0];
  const { data: existing } = await admin
    .from("builder_proposals")
    .select("builder_id")
    .eq("land_listing_id", listing.id);

  const used = new Set((existing ?? []).map((row) => row.builder_id));
  const freeBuilders = builderIds.filter((id) => !used.has(id));
  const slots = Math.min(DEMO_COMPARISON_TEMPLATES.length, freeBuilders.length);

  if (slots === 0) {
    return NextResponse.json({
      inserted: 0,
      listing_id: listing.id,
      message: "This block already has a package from every available builder.",
    });
  }

  const rows = DEMO_COMPARISON_TEMPLATES.slice(0, slots).map((template, index) => ({
    builder_id: freeBuilders[index],
    land_listing_id: listing.id,
    buyer_id: user.id,
    package_name: template.package_name,
    base_price: template.base_price,
    estimated_build_weeks: template.estimated_build_weeks,
    inclusions: template.inclusions,
    notes: template.notes,
    home_specs: template.home_specs,
    price_breakdown: template.price_breakdown,
    inclusion_items: template.inclusion_items,
    status: "pending" as const,
  }));

  const { error: insertError } = await admin.from("builder_proposals").insert(rows);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    inserted: rows.length,
    listing_id: listing.id,
    listing_label: [listing.address, listing.suburb].filter(Boolean).join(", "),
  });
}
