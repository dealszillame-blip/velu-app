/**
 * Seed sold listings for builder leads feed (no auth users required).
 * Usage: npm run seed:leads
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { DEMO_LISTINGS } from "./demo-listings-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || serviceKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error(
    "\n✗ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local\n" +
      "  Copy the service_role secret from Supabase → Project Settings → API\n" +
      "  Or run migrations/mvp/012_builder_leads_seed.sql in the Supabase SQL Editor.\n"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seedSoldListings(): Promise<string[]> {
  const sold = DEMO_LISTINGS.filter((l) => l.status === "sold");
  const ids: string[] = [];

  for (const listing of sold) {
    const soldAt = listing.soldDaysAgo
      ? new Date(Date.now() - listing.soldDaysAgo * 86400000).toISOString()
      : null;

    const { data: listingId, error } = await supabase.rpc(
      "upsert_domain_land_listing",
      {
        p_domain_listing_id: listing.domainListingId,
        p_address: listing.address,
        p_suburb: listing.suburb,
        p_postcode: listing.postcode,
        p_price: listing.price,
        p_price_display: listing.priceDisplay,
        p_land_size_sqm: listing.landSizeSqm,
        p_frontage_meters: listing.frontageMeters,
        p_zoning: listing.zoning,
        p_longitude: listing.longitude,
        p_latitude: listing.latitude,
        p_status: listing.status,
        p_sold_at: soldAt,
        p_domain_data: { demo: true, seed: "builder-leads" },
      }
    );

    if (error) throw new Error(`${listing.address}: ${error.message}`);
    ids.push(listingId as string);
    console.log(`✓ Sold lot: ${listing.address}, ${listing.suburb}`);
  }

  return ids;
}

async function onboardBuilders() {
  const { data: builders, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "builder");

  if (error) throw new Error(error.message);

  for (const builder of builders ?? []) {
    const { data: existing } = await supabase
      .from("builder_profiles")
      .select("id, anchor_geom")
      .eq("id", builder.id)
      .maybeSingle();

    if (!existing) continue;

    if (!existing.anchor_geom) {
      await supabase.rpc("set_builder_anchor_geom", {
        p_builder_id: builder.id,
        p_longitude: 150.8139,
        p_latitude: -34.0669,
        p_address: "Campbelltown NSW 2560",
      });
    }

    await supabase
      .from("builder_profiles")
      .update({
        anchor_address: "Campbelltown NSW 2560",
        is_onboarded: true,
        onboarding_status: "onboarded",
        service_radius_km: 30,
      })
      .eq("id", builder.id);
  }

  console.log(`✓ Onboarded ${builders?.length ?? 0} builder(s) with service area`);
}

async function seedLeadNotifications(listingIds: string[]) {
  const { data: builders } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "builder");

  if (!builders?.length || !listingIds.length) return;

  const { data: listing } = await supabase
    .from("land_listings")
    .select("id, suburb, postcode, land_size_sqm")
    .eq("id", listingIds[0])
    .single();

  if (!listing) return;

  for (const builder of builders) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", builder.id)
      .eq("type", "new_lead")
      .filter("metadata->>listing_id", "eq", listing.id);

    if (count && count > 0) continue;

    await supabase.from("notifications").insert({
      recipient_id: builder.id,
      type: "new_lead",
      title: "New land sold nearby",
      body: `${listing.land_size_sqm}m² in ${listing.suburb} ${listing.postcode} just sold. Submit your proposal now.`,
      metadata: { listing_id: listing.id, demo: true },
    });
  }

  console.log(`✓ Lead notifications for ${builders.length} builder(s)`);
}

async function reportLeadCounts() {
  const { data: builders } = await supabase
    .from("profiles")
    .select("id, full_name, company_name")
    .eq("role", "builder");

  for (const builder of builders ?? []) {
    const { data, error } = await supabase.rpc("get_sold_leads_for_builder", {
      p_builder_id: builder.id,
    });
    const name = builder.company_name ?? builder.full_name;
    if (error) {
      console.warn(`⚠ ${name}: ${error.message}`);
    } else {
      console.log(`  → ${name}: ${data?.length ?? 0} lead(s) in service area`);
    }
  }
}

async function main() {
  console.log("\nVelu — builder leads seed\n");

  const listingIds = await seedSoldListings();
  await onboardBuilders();
  await seedLeadNotifications(listingIds);

  console.log("\nLead counts by builder:");
  await reportLeadCounts();

  console.log(
    "\nDone. Sign in as a builder → /builder/leads to view sold lots.\n"
  );
}

main().catch((err) => {
  console.error("\n✗ Seed failed:", err.message ?? err);
  process.exit(1);
});
