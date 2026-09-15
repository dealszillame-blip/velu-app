/**
 * Google Places (New) lookup for rating + review count.
 * Uses GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY — does not scrape google.com.
 */

export type GooglePlaceRating = {
  place_id: string | null;
  rating: number | null;
  review_count: number | null;
  maps_url: string | null;
  website_url: string | null;
  formatted_address: string | null;
};

function placesKey(): string | null {
  return (
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    null
  );
}

export function googlePlacesConfigured(): boolean {
  return Boolean(placesKey());
}

export async function lookupGooglePlaceRating(
  query: string,
  location?: { latitude: number; longitude: number }
): Promise<GooglePlaceRating | null> {
  const key = placesKey();
  if (!key || !query.trim()) return null;

  const body: Record<string, unknown> = {
    textQuery: query,
    maxResultCount: 3,
    includedType: "general_contractor",
  };

  if (location) {
    body.locationBias = {
      circle: {
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        radius: 25000,
      },
    };
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.websiteUri,places.googleMapsUri",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as {
    places?: Array<{
      id?: string;
      rating?: number;
      userRatingCount?: number;
      formattedAddress?: string;
      websiteUri?: string;
      googleMapsUri?: string;
    }>;
  };

  const place = json.places?.[0];
  if (!place) return null;

  return {
    place_id: place.id ?? null,
    rating: typeof place.rating === "number" ? place.rating : null,
    review_count:
      typeof place.userRatingCount === "number" ? place.userRatingCount : null,
    maps_url: place.googleMapsUri ?? null,
    website_url: place.websiteUri ?? null,
    formatted_address: place.formattedAddress ?? null,
  };
}

export function googleBuilderQuery(
  name: string,
  suburb?: string | null,
  postcode?: string | null
): string {
  return [name, "builder", suburb, postcode, "NSW Australia"]
    .filter(Boolean)
    .join(" ");
}
