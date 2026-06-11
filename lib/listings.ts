import type { ListingStatus } from "@/lib/types";

export interface LandListingRow {
  id: string;
  address: string;
  suburb: string;
  postcode: string;
  price: number;
  price_display?: string | null;
  land_size_sqm: number;
  frontage_meters: number;
  zoning: string;
  status: ListingStatus;
  source?: string;
}

export interface MapListing extends LandListingRow {
  longitude: number;
  latitude: number;
}

export interface MapFilters {
  status?: ListingStatus;
  suburb?: string;
  priceMin?: number;
  priceMax?: number;
  sizeMin?: number;
  sizeMax?: number;
}

export interface CreateListingInput {
  address: string;
  price: number;
  land_size_sqm: number;
  frontage_meters: number;
  zoning: string;
  status?: ListingStatus;
}

export function formatPrice(price: number): string {
  if (price <= 0) return "Contact agent";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function listingPriceLabel(listing: LandListingRow): string {
  if (listing.price > 0) return formatPrice(listing.price);
  return listing.price_display ?? "Contact agent";
}

export function statusLabel(status: ListingStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "under_offer":
      return "Under contract";
    case "sold":
      return "Sold";
  }
}

export function nextStatus(status: ListingStatus): ListingStatus {
  if (status === "available") return "under_offer";
  if (status === "under_offer") return "sold";
  return "sold";
}

export function statusBadgeVariant(
  status: ListingStatus
): "default" | "secondary" | "outline" {
  switch (status) {
    case "available":
      return "default";
    case "under_offer":
      return "secondary";
    case "sold":
      return "outline";
  }
}
