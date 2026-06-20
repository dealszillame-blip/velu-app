/**
 * Seed demo buyers, builders, listings, and proposals.
 * Usage: npm run seed:demo
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import {
  DEMO_BUYER_OWNED_LAND,
  DEMO_BUYER_OWNED_PROPOSALS,
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

async function seedBuyerOwnedLand(
  userIds: Map<string, string>
): Promise<Map<string, string>> {
  const ownedIds = new Map<string, string>();

  for (const parcel of DEMO_BUYER_OWNED_LAND) {
    const buyerId = userIds.get(parcel.buyerEmail);
    if (!buyerId) {
      warn(`Skipping buyer-owned land — no user for ${parcel.buyerEmail}`);
      continue;
    }

    await supabase
      .from("land_listings")
      .delete()
      .eq("buyer_id", buyerId)
      .eq("source", "buyer_owned")
      .eq("address", parcel.address);

    const { data: listingId, error } = await supabase.rpc(
      "create_buyer_owned_listing",
      {
        p_buyer_id: buyerId,
        p_address: parcel.address,
        p_suburb: parcel.suburb,
        p_postcode: parcel.postcode,
        p_land_size_sqm: parcel.landSizeSqm,
        p_frontage_meters: parcel.frontageMeters,
        p_zoning: parcel.zoning,
        p_longitude: parcel.longitude,
        p_latitude: parcel.latitude,
        p_land_value: parcel.landValue,
      }
    );

    if (error) {
      throw new Error(`Buyer-owned ${parcel.address}: ${error.message}`);
    }

    const registeredAt =
      parcel.registeredDaysAgo != null
        ? new Date(Date.now() - parcel.registeredDaysAgo * 86400000).toISOString()
        : new Date().toISOString();

    await supabase
      .from("land_listings")
      .update({ sold_at: registeredAt, created_at: registeredAt })
      .eq("id", listingId);

    ownedIds.set(parcel.key, listingId as string);
    ok(`Buyer-owned land: ${parcel.address}, ${parcel.suburb} (${parcel.buyerEmail})`);
  }

  return ownedIds;
}

async function seedBuyerOwnedProposals(
  ownedIds: Map<string, string>,
  userIds: Map<string, string>
) {
  for (const proposal of DEMO_BUYER_OWNED_PROPOSALS) {
    const listingId = ownedIds.get(proposal.landKey);
    const builderId = userIds.get(proposal.builderEmail);
    const parcel = DEMO_BUYER_OWNED_LAND.find((p) => p.key === proposal.landKey);
    const buyerId = parcel ? userIds.get(parcel.buyerEmail) : undefined;

    if (!listingId || !builderId || !buyerId) {
      warn(`Skipping buyer-owned proposal — ${proposal.packageName}`);
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
      warn(`Buyer-owned proposal ${proposal.packageName}: ${error.message}`);
    } else {
      ok(`Buyer-owned proposal: ${proposal.packageName} → ${proposal.landKey}`);
    }
  }
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
  const ownedIds = await seedBuyerOwnedLand(userIds);
  await seedProposals(listingIds, userIds, buyerId);
  await seedBuyerOwnedProposals(ownedIds, userIds);

  console.log("\n── Demo login credentials (password for all: VeluDemo123!) ──\n");
  console.log("  Buyer:    demo.buyer@velu.dev");
  console.log("  Buyer 2:  demo.buyer2@velu.dev");
  console.log("  Builder:  demo.builder@velu.dev      (Apex Homes)");
  console.log("  Builder:  demo.builder2@velu.dev     (Meridian Building Co)");
  console.log("  Builder:  demo.builder3@velu.dev     (SouthWest Living)");
  console.log("\n── Test the core loop ──\n");
  console.log("  1. Sign in as demo.buyer@velu.dev → /buyer/my-land (Mount Annan block)");
  console.log("  2. Sign in as demo.buyer2@velu.dev → /buyer/my-land (2 registered blocks)");
  console.log("  3. Sign in as demo.buyer@velu.dev → /buyer/compare (proposals on Leumeah + Mount Annan)");
  console.log("  4. Sign in as demo.builder@velu.dev → /builder/leads (sold + buyer-owned leads)");
  console.log("  5. /buyer/map → available listings (buyer-owned hidden from map)\n");
}

main().catch((err) => {
  console.error("\n✗ Seed failed:", err.message ?? err);
  process.exit(1);
});
