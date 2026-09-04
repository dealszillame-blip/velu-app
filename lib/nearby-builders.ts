export type NearbyBuilderPortfolioItem = {
  id: string;
  title: string;
  location: string | null;
  completed_year: number | null;
  image_url: string | null;
};

export type NearbyBuilderNotice = {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "action";
  issued_at: string | null;
  source: string;
};

export type NearbyBuilder = {
  id: string;
  full_name: string;
  company_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  anchor_address: string | null;
  service_radius_km: number;
  profile_published: boolean;
  license_number?: string | null;
  insurance_verified?: boolean;
  years_in_business?: number | null;
  notices?: NearbyBuilderNotice[];
  distance_km: number;
  portfolio: NearbyBuilderPortfolioItem[];
};

export function displayNearbyBuilderName(builder: NearbyBuilder): string {
  return builder.company_name?.trim() || builder.full_name;
}

export function inviteToReviewPrefill(suburb: string, address: string): string {
  return `Hi — I've registered my land at ${address} (${suburb}) on Velu and would like to invite you to review the block. Could you let me know if you service this area and what build options might suit the site?`;
}
