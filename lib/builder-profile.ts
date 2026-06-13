export type GalleryCategory = "project" | "team" | "site" | "completion";

export interface PortfolioProject {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  completed_year?: number | null;
  image_url?: string;
  sort_order?: number;
}

export interface GoogleReviewHighlight {
  id?: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  reviewed_at?: string | null;
  sort_order?: number;
}

export interface ProductReview {
  id?: string;
  product_name: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  reviewed_at?: string | null;
  is_verified?: boolean;
  sort_order?: number;
}

export interface GalleryImage {
  id?: string;
  image_url: string;
  caption?: string;
  category: GalleryCategory;
  sort_order?: number;
}

export interface BuilderPublicProfile {
  id: string;
  full_name: string;
  company_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  cover_image_url: string | null;
  google_maps_url: string | null;
  google_rating: number | null;
  google_review_count: number;
  website_url: string | null;
  years_in_business: number | null;
  service_radius_km: number;
  anchor_address: string | null;
  is_onboarded: boolean;
  profile_published: boolean;
  license_number: string;
  insurance_verified: boolean;
  portfolio: PortfolioProject[];
  google_reviews: GoogleReviewHighlight[];
  product_reviews: ProductReview[];
  gallery: GalleryImage[];
}

export interface BuilderProfileInput {
  full_name?: string;
  company_name?: string;
  avatar_url?: string;
  headline?: string;
  bio?: string;
  cover_image_url?: string;
  google_maps_url?: string;
  google_rating?: number | null;
  google_review_count?: number;
  website_url?: string;
  years_in_business?: number | null;
  profile_published?: boolean;
  portfolio?: PortfolioProject[];
  google_reviews?: GoogleReviewHighlight[];
  product_reviews?: ProductReview[];
  gallery?: GalleryImage[];
}

export function displayBuilderName(profile: {
  company_name?: string | null;
  full_name: string;
}): string {
  return profile.company_name?.trim() || profile.full_name;
}

export function averageRating(
  reviews: { rating: number }[]
): number | null {
  if (!reviews.length) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
