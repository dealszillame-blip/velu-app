export type BuilderComplianceNotice = {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "action";
  issued_at: string | null;
  source: string;
};

export type MapBuilder = {
  id: string;
  full_name: string;
  company_name: string | null;
  google_rating: number | null;
  years_in_business: number | null;
  license_number: string | null;
  insurance_verified: boolean;
  service_radius_km: number;
  longitude: number;
  latitude: number;
};

export function displayMapBuilderName(builder: MapBuilder): string {
  return builder.company_name?.trim() || builder.full_name;
}
