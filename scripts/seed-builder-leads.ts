/**
 * Seed sold listings for builder leads feed (no auth users required).
 * Usage: npm run seed:leads
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { DEMO_LISTINGS, type DemoListing } from "./demo-listings-data";

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

async function upsertSoldListing(listing: DemoListing): Promise<string> {
  const soldAt = listing.soldDaysAgo
    ? new Date(Date.now() - listing.soldDaysAgo * 86400000).toISOString()
    : null;

  const baseRow = {
    domain_listing_id: listing.domainListingId,
    address: listing.address,
    suburb: listing.suburb,
    postcode: listing.postcode,
    price: listing.price,
    price_display: listing.priceDisplay,
    land_size_sqm: listing.landSizeSqm,
    frontage_meters: listing.frontageMeters,
    zoning: listing.zoning,
    status: listing.status,
    sold_at: soldAt,
    source: "domain",
    listing_category: "vacant_land",
    domain_synced_at: new Date().toISOString(),
    domain_data: { demo: true, seed: "builder-leads" },
  };

  const { data: byDomainId } = await supabase
    .from("land_listings")
    .select("id")
    .eq("domain_listing_id", listing.domainListingId)
    .maybeSingle();

  if (byDomainId) {
    const { error } = await supabase
      .from("land_listings")
      .update(baseRow)
      .eq("id", byDomainId.id);
    if (error) throw new Error(`${listing.address}: ${error.message}`);
    return byDomainId.id;
  }

  const { data: byAddress } = await supabase
    .from("land_listings")
    .select("id")
    .eq("address", listing.address)
    .eq("suburb", listing.suburb)
    .maybeSingle();

  if (byAddress) {
    const { error } = await supabase
      .from("land_listings")
      .update(baseRow)
      .eq("id", byAddress.id);
    if (error) throw new Error(`${listing.address}: ${error.message}`);
    return byAddress.id;
  }

  const { data: inserted, error } = await supabase
    .from("land_listings")
    .insert({
      ...baseRow,
      geom: `SRID=4326;POINT(${listing.longitude} ${listing.latitude})`,
    })
    .select("id")
    .single();

  if (error) throw new Error(`${listing.address}: ${error.message}`);
  return inserted.id;
}

async function seedSoldListings(): Promise<string[]> {
  const sold = DEMO_LISTINGS.filter((l) => l.status === "sold");
  const ids: string[] = [];

  for (const listing of sold) {
    const listingId = await upsertSoldListing(listing);
    ids.push(listingId);
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
