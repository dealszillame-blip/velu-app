import { DOMAIN_DEFAULT_ZONING } from "@/lib/domain/config";
import type {
  DomainListingPayload,
  DomainListingType,
  NormalizedDomainListing,
} from "@/lib/domain/types";
import type { ListingStatus } from "@/lib/types";

const UNDER_CONTRACT_LABELS = new Set([
  "under contract",
  "under offer",
  "undercontract",
]);

export function mapDomainStatus(
  listingType: DomainListingType,
  listing: DomainListingPayload
): ListingStatus {
  if (listingType === "Sold") {
    return "sold";
  }

  const labels = (listing.labels ?? []).map((label) => label.toLowerCase());
  if (labels.some((label) => UNDER_CONTRACT_LABELS.has(label))) {
    return "under_offer";
  }

  return "available";
}

export function parseDomainPrice(priceDetails?: {
  canDisplayPrice?: boolean;
  price?: number;
  displayPrice?: string;
}): { price: number; priceDisplay: string | null } {
  if (priceDetails?.canDisplayPrice && priceDetails.price != null) {
    return {
      price: priceDetails.price,
      priceDisplay: priceDetails.displayPrice ?? null,
    };
  }

  const display = priceDetails?.displayPrice?.trim();
  if (display) {
    const match = display.replace(/,/g, "").match(/\$?\s*([\d.]+)/);
    if (match) {
      return { price: Number(match[1]), priceDisplay: display };
    }
    return { price: 0, priceDisplay: display };
  }

  return { price: 0, priceDisplay: "Contact agent" };
}

export function estimateFrontageMeters(landAreaSqm: number): number {
  if (landAreaSqm <= 0) return 12;
  return Math.max(8, Math.round(Math.sqrt(landAreaSqm) * 0.45 * 10) / 10);
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeDomainListing(
  listingType: DomainListingType,
  listing: DomainListingPayload
): NormalizedDomainListing | null {
  const id = listing.id;
  const details = listing.propertyDetails;

  if (!id || !details?.latitude || !details?.longitude) {
    return null;
  }

  const propertyTypes = [
    details.propertyType,
    ...(details.allPropertyTypes ?? []),
  ]
    .filter(Boolean)
    .map((value) => value!.toLowerCase());

  const isVacantLand = propertyTypes.some((type) =>
    type.includes("vacant") || type.includes("land")
  );

  if (!isVacantLand) {
    return null;
  }

  const suburb = titleCase(details.suburb ?? "Unknown");
  const postcode = (details.postcode ?? "").slice(0, 4);
  const address =
    details.displayableAddress ??
    [details.streetNumber, details.street, suburb].filter(Boolean).join(" ");

  if (!address || !postcode) {
    return null;
  }

  const { price, priceDisplay } = parseDomainPrice(listing.priceDetails);
  const landSizeSqm = details.landArea ?? 0;
  const status = mapDomainStatus(listingType, listing);

  let soldAt: string | null = null;
  if (status === "sold" && listing.soldData?.soldDate) {
    soldAt = new Date(listing.soldData.soldDate).toISOString();
  }

  const soldPrice = listing.soldData?.soldPrice;
  const resolvedPrice =
    status === "sold" && soldPrice != null ? soldPrice : price;

  return {
    domainListingId: String(id),
    address,
    suburb,
    postcode,
    price: resolvedPrice,
    priceDisplay,
    landSizeSqm: landSizeSqm > 0 ? landSizeSqm : 400,
    frontageMeters: estimateFrontageMeters(landSizeSqm > 0 ? landSizeSqm : 400),
    zoning: DOMAIN_DEFAULT_ZONING,
    longitude: details.longitude,
    latitude: details.latitude,
    status,
    soldAt,
    raw: listing,
  };
}

export function flattenDomainSearchResults(
  listingType: DomainListingType,
  items: Array<{ type?: string; listing?: DomainListingPayload }>
): NormalizedDomainListing[] {
  const normalized: NormalizedDomainListing[] = [];

  for (const item of items) {
    if (item.type !== "PropertyListing" || !item.listing) continue;
    const mapped = normalizeDomainListing(listingType, item.listing);
    if (mapped) normalized.push(mapped);
  }

  return normalized;
}
