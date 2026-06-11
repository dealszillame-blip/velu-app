import { getDomainAccessToken } from "@/lib/domain/auth";
import {
  DOMAIN_API_BASE,
  DOMAIN_SEARCH_LOCATIONS,
  DOMAIN_SEARCH_PAGE_SIZE,
  DOMAIN_VACANT_LAND_TYPES,
} from "@/lib/domain/config";
import { flattenDomainSearchResults } from "@/lib/domain/mappers";
import type {
  DomainListingType,
  DomainSearchRequest,
  DomainSearchResultItem,
  NormalizedDomainListing,
} from "@/lib/domain/types";

async function domainFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = await getDomainAccessToken();
  const res = await fetch(`${DOMAIN_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Domain API ${path} failed (${res.status}): ${detail}`);
  }

  return res.json() as Promise<T>;
}

export async function searchDomainResidentialListings(
  listingType: DomainListingType,
  pageNumber = 1
): Promise<DomainSearchResultItem[]> {
  const body: DomainSearchRequest = {
    listingType,
    propertyTypes: [...DOMAIN_VACANT_LAND_TYPES],
    locations: DOMAIN_SEARCH_LOCATIONS.map((location) => ({
      state: location.state,
      suburb: location.suburb,
      postCode: location.postCode,
      includeSurroundingSuburbs: true,
    })),
    pageNumber,
    pageSize: DOMAIN_SEARCH_PAGE_SIZE,
  };

  return domainFetch<DomainSearchResultItem[]>(
    "/v1/listings/residential/_search",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export async function fetchAllDomainVacantLand(
  listingType: DomainListingType
): Promise<NormalizedDomainListing[]> {
  const all: NormalizedDomainListing[] = [];
  const seen = new Set<string>();
  let page = 1;

  while (page <= 20) {
    const batch = await searchDomainResidentialListings(listingType, page);
    if (!batch.length) break;

    const mapped = flattenDomainSearchResults(listingType, batch);
    for (const listing of mapped) {
      if (seen.has(listing.domainListingId)) continue;
      seen.add(listing.domainListingId);
      all.push(listing);
    }

    if (batch.length < DOMAIN_SEARCH_PAGE_SIZE) break;
    page += 1;
  }

  return all;
}

export async function fetchDomainVacantLandByStatus(): Promise<{
  available: NormalizedDomainListing[];
  underOffer: NormalizedDomainListing[];
  sold: NormalizedDomainListing[];
}> {
  const [saleListings, soldListings] = await Promise.all([
    fetchAllDomainVacantLand("Sale"),
    fetchAllDomainVacantLand("Sold"),
  ]);

  const available = saleListings.filter((l) => l.status === "available");
  const underOffer = saleListings.filter((l) => l.status === "under_offer");

  return {
    available,
    underOffer,
    sold: soldListings.map((listing) => ({
      ...listing,
      status: "sold" as const,
      soldAt: listing.soldAt ?? new Date().toISOString(),
    })),
  };
}
