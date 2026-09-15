import type { NearbyBuilder } from "@/lib/nearby-builders";
import type { NswRegisterBuilder } from "@/lib/nsw-register";

export type LicensedBuilderRow = {
  id: string;
  licence_number: string;
  licensee: string;
  suburb: string | null;
  postcode: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string | null;
  expires: string | null;
  verify_url: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_maps_url: string | null;
  website_url: string | null;
  last_property_sold_address: string | null;
  last_property_sold_at: string | null;
  avg_delay_weeks: number | null;
  distance_km?: number | null;
};

export function licensedToNearby(row: LicensedBuilderRow): NearbyBuilder {
  const address = [row.suburb, row.state, row.postcode].filter(Boolean).join(" ");
  return {
    id: row.id,
    full_name: row.licensee,
    company_name: row.licensee,
    avatar_url: null,
    headline: `NSW contractor licence ${row.licence_number} · ${row.status ?? "Current"}`,
    google_rating: row.google_rating,
    google_review_count: row.google_review_count,
    anchor_address: address || null,
    service_radius_km: 40,
    profile_published: false,
    license_number: row.licence_number,
    is_license_valid: (row.status ?? "Current") === "Current",
    license_verify_url: row.verify_url,
    insurance_verified: false,
    builder_type: null,
    last_property_sold_address: row.last_property_sold_address,
    last_property_sold_at: row.last_property_sold_at,
    avg_delay_weeks: row.avg_delay_weeks,
    notices: [],
    distance_km: row.distance_km ?? 0,
    portfolio: [],
    source: "nsw_register",
    google_maps_url: row.google_maps_url,
  };
}

export function nswRegisterToUpsert(row: NswRegisterBuilder) {
  return {
    licence_number: row.licence_number,
    nsw_licence_id: row.licence_id,
    licensee: row.licensee,
    licensee_type: row.licensee_type,
    licence_type: row.licence_type,
    status: row.status ?? "Current",
    granted_on: row.granted,
    expires_on: row.expires,
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    latitude: row.latitude,
    longitude: row.longitude,
    abn: row.abn,
    acn: row.acn,
    verify_url: row.verify_url,
    source: "verify_nsw",
    last_synced_at: new Date().toISOString(),
  };
}
