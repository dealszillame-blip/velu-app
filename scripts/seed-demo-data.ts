/**
 * Seed demo buyers, builders, listings, and proposals.
 * Usage: npm run seed:demo
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import {
  DEMO_LISTINGS,
  DEMO_PROPOSALS,
  DEMO_USERS,
} from "./demo-listings-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || serviceKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error(
    "\n✗ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local\n" +
      "  Copy the service_role secret from Supabase → Project Settings → API\n"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function ok(msg: string) {
  console.log(`✓ ${msg}`);
}

function warn(msg: string) {
  console.warn(`⚠ ${msg}`);
}

async function ensureUser(user: (typeof DEMO_USERS)[number]): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      intended_role: user.role,
      full_name: user.fullName,
      phone_number: user.phone ?? null,
    },
  });

  if (!error && data.user) {
    ok(`Created user: ${user.email}`);
    return data.user.id;
  }

  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = list?.users.find((u) => u.email === user.email);
  if (found) {
    ok(`User exists: ${user.email}`);
    return found.id;
  }

  throw new Error(`Failed to create ${user.email}: ${error?.message}`);
}

async function ensureProfile(user: (typeof DEMO_USERS)[number], userId: string) {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    role: user.role,
    full_name: user.fullName,
    phone_number: user.phone ?? null,
    company_name: user.companyName ?? null,
  });

  if (error) throw new Error(`Profile upsert failed for ${user.email}: ${error.message}`);
  ok(`Profile: ${user.fullName} (${user.role})`);
}

async function ensureBuilderProfile(user: (typeof DEMO_USERS)[number], userId: string) {
  if (user.role !== "builder" || !user.licenseNumber) return;

  const { error } = await supabase.from("builder_profiles").upsert({
    id: userId,
    license_number: user.licenseNumber,
    is_license_valid: true,
    insurance_verified: true,
    service_radius_km: user.serviceRadiusKm,
    anchor_address: user.anchorAddress,
    subscription_tier: "pro",
    is_onboarded: true,
    onboarding_status: "onboarded",
    onboarded_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Builder profile failed for ${user.email}: ${error.message}`);

  const { error: geoError } = await supabase.rpc("set_builder_anchor_geom", {
    p_builder_id: userId,
    p_longitude: user.anchorLng,
    p_latitude: user.anchorLat,
    p_address: user.anchorAddress,
  });

  if (geoError) throw new Error(`Anchor geom failed for ${user.email}: ${geoError.message}`);
  ok(`Builder onboarded: ${user.companyName}`);
}

async function seedListings(buyerId: string): Promise<Map<string, string>> {
  const listingIds = new Map<string, string>();

  for (const listing of DEMO_LISTINGS) {
    const soldAt =
      listing.status === "sold" && listing.soldDaysAgo != null
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
        p_domain_data: {
          demo: true,
          source_label: "Domain-style demo data",
        },
      }
    );

    if (error) throw new Error(`Listing ${listing.address}: ${error.message}`);

    listingIds.set(listing.domainListingId, listingId as string);

    // Link primary buyer to sold Leumeah lot (core demo loop)
    if (listing.domainListingId === "DEMO-013" && listing.status === "sold") {
      await supabase
        .from("land_listings")
        .update({ buyer_id: buyerId, sold_at: soldAt })
        .eq("id", listingId);
    }
  }

  ok(`${DEMO_LISTINGS.length} listings seeded`);
  return listingIds;
}

async function seedProposals(
  listingIds: Map<string, string>,
  userIds: Map<string, string>,
  buyerId: string
) {
  for (const proposal of DEMO_PROPOSALS) {
    const listingId = listingIds.get(proposal.listingDomainId);
    const builderId = userIds.get(proposal.builderEmail);

    if (!listingId || !builderId) {
      warn(`Skipping proposal — missing listing or builder for ${proposal.packageName}`);
      continue;
    }

    const { error } = await supabase.from("builder_proposals").upsert(
      {
        builder_id: builderId,
        land_listing_id: listingId,
        buyer_id: buyerId,
        package_name: proposal.packageName,
        base_price: proposal.basePrice,
        estimated_build_weeks: proposal.estimatedBuildWeeks,
        inclusions: proposal.inclusions,
        notes: proposal.notes,
        status: proposal.status,
        viewed_at: proposal.status === "viewed" ? new Date().toISOString() : null,
      },
      { onConflict: "builder_id,land_listing_id" }
    );

    if (error) {
      warn(`Proposal ${proposal.packageName}: ${error.message}`);
    } else {
      ok(`Proposal: ${proposal.packageName} → ${proposal.listingDomainId}`);
    }
  }

  // Notify buyer about proposals
  await supabase.from("notifications").insert({
    recipient_id: buyerId,
    type: "proposal_received",
    title: "New build proposals",
    body: "You have builder proposals waiting on your sold lot at 7 Wattle Grove, Leumeah.",
    metadata: { demo: true },
  });
}

async function main() {
  console.log("\nVelu — demo data seed\n");

  const userIds = new Map<string, string>();

  for (const user of DEMO_USERS) {
    const id = await ensureUser(user);
    userIds.set(user.email, id);
    await ensureProfile(user, id);
    await ensureBuilderProfile(user, id);
  }

  const buyerId = userIds.get("demo.buyer@velu.dev")!;
  const listingIds = await seedListings(buyerId);
  await seedProposals(listingIds, userIds, buyerId);

  console.log("\n── Demo login credentials (password for all: VeluDemo123!) ──\n");
  console.log("  Buyer:    demo.buyer@velu.dev");
  console.log("  Buyer 2:  demo.buyer2@velu.dev");
  console.log("  Builder:  demo.builder@velu.dev      (Apex Homes)");
  console.log("  Builder:  demo.builder2@velu.dev     (Meridian Building Co)");
  console.log("  Builder:  demo.builder3@velu.dev     (SouthWest Living)");
  console.log("\n── Test the core loop ──\n");
  console.log("  1. Sign in as demo.buyer@velu.dev → /buyer/compare (2 proposals on Leumeah lot)");
  console.log("  2. Sign in as demo.builder@velu.dev → /builder/leads (3 sold lots)");
  console.log("  3. /buyer/map → 10 available + 2 under contract listings\n");
}

main().catch((err) => {
  console.error("\n✗ Seed failed:", err.message ?? err);
  process.exit(1);
});
