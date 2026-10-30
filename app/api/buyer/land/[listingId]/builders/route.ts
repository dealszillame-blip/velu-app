import { NextResponse } from "next/server";
import type { NearbyBuilder } from "@/lib/nearby-builders";
import { isPlaceholderDirectoryBuilder } from "@/lib/placeholder-builders";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ listingId: string }>;
};

const VERIFIED_BUILDER_LIMIT = 10;

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

  const { data: onboarded, error: onboardedError } = await supabase.rpc(
    "get_public_builders_near_listing",
    { p_listing_id: listingId }
  );

  if (onboardedError) {
    const message = onboardedError.message.includes("get_public_builders_near_listing")
      ? "Nearby builders lookup is not set up yet. Run migration 020_nearby_builders_for_buyer.sql in Supabase."
      : onboardedError.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const verified = (Array.isArray(onboarded) ? (onboarded as NearbyBuilder[]) : [])
    .map((builder) => ({ ...builder, source: "onboarded" as const }))
    .filter(
      (builder) =>
        builder.insurance_verified === true &&
        !isPlaceholderDirectoryBuilder(builder)
    )
    .sort((a, b) => (a.distance_km ?? Number.POSITIVE_INFINITY) - (b.distance_km ?? Number.POSITIVE_INFINITY))
    .slice(0, VERIFIED_BUILDER_LIMIT);

  return NextResponse.json(verified);
}
