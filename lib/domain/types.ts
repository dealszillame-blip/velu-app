import type { ListingStatus } from "@/lib/types";

export type DomainListingType = "Sale" | "Sold";

export interface DomainSearchLocation {
  state: string;
  suburb?: string;
  postCode?: string;
  includeSurroundingSuburbs?: boolean;
}

export interface DomainSearchRequest {
  listingType: DomainListingType;
  propertyTypes: string[];
  locations: DomainSearchLocation[];
  pageNumber?: number;
  pageSize?: number;
  minPrice?: number;
  maxPrice?: number;
  minLandArea?: number;
  maxLandArea?: number;
}

export interface DomainPriceDetails {
  canDisplayPrice?: boolean;
  price?: number;
  displayPrice?: string;
}

export interface DomainPropertyDetails {
  state?: string;
  propertyType?: string;
  allPropertyTypes?: string[];
  suburb?: string;
  postcode?: string;
  displayableAddress?: string;
  latitude?: number;
  longitude?: number;
  landArea?: number;
  street?: string;
  streetNumber?: string;
}

export interface DomainListingPayload {
  listingType?: string;
  id?: number;
  priceDetails?: DomainPriceDetails;
  propertyDetails?: DomainPropertyDetails;
  headline?: string;
  labels?: string[];
  soldData?: {
    soldDate?: string;
    soldPrice?: number;
  };
}

export interface DomainSearchResultItem {
  type?: string;
  listing?: DomainListingPayload;
}

export interface NormalizedDomainListing {
  domainListingId: string;
  address: string;
  suburb: string;
  postcode: string;
  price: number;
  priceDisplay: string | null;
  landSizeSqm: number;
  frontageMeters: number;
  zoning: string;
  longitude: number;
  latitude: number;
  status: ListingStatus;
  soldAt: string | null;
  raw: DomainListingPayload;
}

export interface DomainSyncResult {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: string[];
  byStatus: Record<ListingStatus, number>;
}
