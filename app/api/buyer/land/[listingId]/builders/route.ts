import { NextResponse } from "next/server";
import { licensedToNearby, type LicensedBuilderRow } from "@/lib/licensed-builders";
import type { NearbyBuilder } from "@/lib/nearby-builders";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ listingId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { listingId } = await context.params;
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

  const [{ data: onboarded, error: onboardedError }, { data: licensed, error: licensedError }] =
    await Promise.all([
      supabase.rpc("get_public_builders_near_listing", {
        p_listing_id: listingId,
      }),
      supabase.rpc("get_licensed_builders_near_listing", {
        p_listing_id: listingId,
        p_radius_km: 40,
        p_limit: 20,
      }),
    ]);

  if (onboardedError) {
    const message = onboardedError.message.includes("get_public_builders_near_listing")
      ? "Nearby builders lookup is not set up yet. Run migration 020_nearby_builders_for_buyer.sql in Supabase."
      : onboardedError.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const registerRows = Array.isArray(licensed) ? (licensed as LicensedBuilderRow[]) : [];
  const registerBuilders = registerRows.map(licensedToNearby);

  const onboardedBuilders = (
    Array.isArray(onboarded) ? (onboarded as NearbyBuilder[]) : []
  ).map((builder) => ({ ...builder, source: "onboarded" as const }));

  if (licensedError && registerBuilders.length === 0) {
    return NextResponse.json(onboardedBuilders);
  }

  return NextResponse.json([...registerBuilders, ...onboardedBuilders]);
}
