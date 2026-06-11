export interface GeocodeResult {
  longitude: number;
  latitude: number;
  placeName: string;
  suburb: string;
  postcode: string;
  address: string;
}

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    town?: string;
    city?: string;
    municipality?: string;
    postcode?: string;
  };
};

function buildStreetAddress(address: NominatimResult["address"]): string {
  if (!address) return "";
  const parts = [address.house_number, address.road].filter(Boolean);
  return parts.join(" ");
}

function extractSuburb(address: NominatimResult["address"]): string {
  if (!address) return "";
  return (
    address.suburb ??
    address.town ??
    address.city ??
    address.municipality ??
    ""
  );
}

/** Geocode an Australian address via OpenStreetMap Nominatim (free, no API key). */
export async function geocodeAddress(
  query: string
): Promise<GeocodeResult | null> {
  const encoded = encodeURIComponent(`${query}, NSW, Australia`);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=au&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Velu/1.0 (https://velu.au; land marketplace MVP)",
      Accept: "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!response.ok) return null;

  const results = (await response.json()) as NominatimResult[];
  const hit = results[0];
  if (!hit) return null;

  const street = buildStreetAddress(hit.address) || hit.display_name.split(",")[0];

  return {
    longitude: Number(hit.lon),
    latitude: Number(hit.lat),
    placeName: hit.display_name,
    suburb: extractSuburb(hit.address),
    postcode: hit.address?.postcode ?? "",
    address: street.trim(),
  };
}
