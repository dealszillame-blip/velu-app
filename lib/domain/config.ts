/** South West Sydney suburbs + postcodes for Domain listing search */
export const DOMAIN_SEARCH_LOCATIONS = [
  { state: "NSW", suburb: "Campbelltown", postCode: "2560" },
  { state: "NSW", suburb: "Ingleburn", postCode: "2565" },
  { state: "NSW", suburb: "Liverpool", postCode: "2170" },
  { state: "NSW", suburb: "Camden", postCode: "2570" },
  { state: "NSW", suburb: "Leumeah", postCode: "2560" },
  { state: "NSW", suburb: "Minto", postCode: "2566" },
  { state: "NSW", suburb: "Gregory Hills", postCode: "2557" },
  { state: "NSW", suburb: "Oran Park", postCode: "2570" },
  { state: "NSW", suburb: "Narellan", postCode: "2567" },
] as const;

export const DOMAIN_API_BASE = "https://api.domain.com.au";
export const DOMAIN_AUTH_URL = "https://auth.domain.com.au/v1/connect/token";
export const DOMAIN_LISTINGS_SCOPE = "api_listings_read";
export const DOMAIN_VACANT_LAND_TYPES = ["VacantLand"] as const;
export const DOMAIN_DEFAULT_ZONING = "R2";
export const DOMAIN_SEARCH_PAGE_SIZE = 100;
