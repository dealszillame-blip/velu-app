/**
 * Seed buyer-owned land for demo buyers only.
 * Usage: npm run seed:buyer-land
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and migration 015 applied.
 */

import { createClient } from "@supabase/supabase-js";
import {
  DEMO_BUYER_OWNED_LAND,
  DEMO_BUYER_OWNED_PROPOSALS,
  DEMO_USERS,
} from "./demo-listings-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || serviceKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("\n✗ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local\n");
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

async function resolveUserIds(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  const buyerEmails = [
    ...new Set(DEMO_BUYER_OWNED_LAND.map((p) => p.buyerEmail)),
    ...new Set(DEMO_BUYER_OWNED_PROPOSALS.map((p) => p.builderEmail)),
  ];

  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  for (const email of buyerEmails) {
    const user = list?.users.find((u) => u.email === email);
    if (user) {
      ids.set(email, user.id);
      continue;
    }

    const demo = DEMO_USERS.find((u) => u.email === email);
    if (!demo) continue;

    const { data, error } = await supabase.auth.admin.createUser({
      email: demo.email,
      password: demo.password,
      email_confirm: true,
      user_metadata: {
        intended_role: demo.role,
        full_name: demo.fullName,
        phone_number: demo.phone ?? null,
      },
    });

    if (error || !data.user) {
      warn(`Could not create ${email}: ${error?.message}`);
      continue;
    }

    await supabase.from("profiles").upsert({
      id: data.user.id,
      role: demo.role,
      full_name: demo.fullName,
      phone_number: demo.phone ?? null,
      company_name: demo.companyName ?? null,
    });

    ids.set(email, data.user.id);
    ok(`Created user: ${email}`);
  }

  return ids;
}

async function main() {
  console.log("\nVelu — buyer-owned land seed\n");

  const userIds = await resolveUserIds();
  const ownedIds = new Map<string, string>();

  for (const parcel of DEMO_BUYER_OWNED_LAND) {
    const buyerId = userIds.get(parcel.buyerEmail);
    if (!buyerId) {
      warn(`No buyer account for ${parcel.buyerEmail}`);
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
      console.error(`\n✗ ${parcel.address}: ${error.message}`);
      process.exit(1);
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
    ok(`${parcel.buyerEmail} → ${parcel.address}, ${parcel.suburb}`);
  }

  for (const proposal of DEMO_BUYER_OWNED_PROPOSALS) {
    const listingId = ownedIds.get(proposal.landKey);
    const builderId = userIds.get(proposal.builderEmail);
    const parcel = DEMO_BUYER_OWNED_LAND.find((p) => p.key === proposal.landKey);
    const buyerId = parcel ? userIds.get(parcel.buyerEmail) : undefined;

    if (!listingId || !builderId || !buyerId) continue;

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

    if (error) warn(`Proposal ${proposal.packageName}: ${error.message}`);
    else ok(`Proposal: ${proposal.packageName}`);
  }

  console.log("\n── Sign in to view registered land ──\n");
  console.log("  demo.buyer@velu.dev  → /buyer/my-land (Mount Annan)");
  console.log("  demo.buyer2@velu.dev → /buyer/my-land (Oran Park + Gledswood Hills)\n");
}

main().catch((err) => {
  console.error("\n✗ Seed failed:", err.message ?? err);
  process.exit(1);
});
