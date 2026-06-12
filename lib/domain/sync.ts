import { fetchDomainVacantLandByStatus } from "@/lib/domain/client";
import type { DomainSyncResult, NormalizedDomainListing } from "@/lib/domain/types";
import { notifyBuildersOnSold } from "@/lib/leads/notify-on-sold";
import { createServiceClient } from "@/lib/supabase/admin";
import type { ListingStatus } from "@/lib/types";

async function upsertListing(
  listing: NormalizedDomainListing
): Promise<{ becameSold: boolean; listingId: string | null }> {
  const supabase = await createServiceClient();

  const { data: existing } = await supabase
    .from("land_listings")
    .select("id, status")
    .eq("domain_listing_id", listing.domainListingId)
    .maybeSingle();

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
      p_sold_at: listing.soldAt,
      p_domain_data: listing.raw,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  const becameSold =
    listing.status === "sold" && existing?.status !== "sold";

  return { becameSold, listingId: listingId as string | null };
}

export async function syncDomainListings(): Promise<DomainSyncResult> {
  const grouped = await fetchDomainVacantLandByStatus();
  const listings = [
    ...grouped.available,
    ...grouped.underOffer,
    ...grouped.sold,
  ];

  const result: DomainSyncResult = {
    fetched: listings.length,
    upserted: 0,
    skipped: 0,
    errors: [],
    byStatus: {
      available: 0,
      under_offer: 0,
      sold: 0,
    },
  };

  for (const listing of listings) {
    try {
      const { becameSold, listingId } = await upsertListing(listing);
      result.upserted += 1;
      result.byStatus[listing.status as ListingStatus] += 1;

      if (becameSold && listingId) {
        await notifyBuildersOnSold({
          id: listingId,
          land_size_sqm: listing.landSizeSqm,
          suburb: listing.suburb,
          postcode: listing.postcode,
        });
      }
    } catch (err) {
      result.skipped += 1;
      result.errors.push(
        `${listing.domainListingId}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return result;
}
