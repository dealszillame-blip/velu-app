export type RatingDisplay = {
  rating: number;
  reviewCount: number | null;
  source: "google" | "unverified";
  label: string;
};

export function ratingDisplay(input: {
  google_rating?: number | null;
  google_review_count?: number | null;
  google_maps_url?: string | null;
  source?: "onboarded" | "nsw_register" | null;
}): RatingDisplay | null {
  if (input.google_rating == null) return null;
  const fromGoogle =
    input.source === "nsw_register" || Boolean(input.google_maps_url);
  return {
    rating: input.google_rating,
    reviewCount: input.google_review_count ?? null,
    source: fromGoogle ? "google" : "unverified",
    label: fromGoogle
      ? "Google rating"
      : "Unverified rating (not from Google Places or the NSW register)",
  };
}
