import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.admin
    .from("builder_proposals")
    .select(
      "id, package_name, base_price, status, created_at, viewed_at, responded_at, builder_id, land_listing_id, buyer_id"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const profileIds = new Set<string>();
  const listingIds = new Set<string>();

  for (const row of rows) {
    profileIds.add(row.builder_id);
    if (row.buyer_id) profileIds.add(row.buyer_id);
    listingIds.add(row.land_listing_id);
  }

  const [{ data: profiles }, { data: listings }] = await Promise.all([
    profileIds.size
      ? auth.admin
          .from("profiles")
          .select("id, full_name, company_name")
          .in("id", [...profileIds])
      : Promise.resolve({ data: [] }),
    listingIds.size
      ? auth.admin
          .from("land_listings")
          .select("id, address, suburb, postcode")
          .in("id", [...listingIds])
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const listingMap = new Map((listings ?? []).map((l) => [l.id, l]));

  const enriched = rows.map((row) => ({
    ...row,
    builder: profileMap.get(row.builder_id) ?? null,
    buyer: row.buyer_id ? profileMap.get(row.buyer_id) ?? null : null,
    listing: listingMap.get(row.land_listing_id) ?? null,
  }));

  return NextResponse.json(enriched);
}
