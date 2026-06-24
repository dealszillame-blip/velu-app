import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

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
