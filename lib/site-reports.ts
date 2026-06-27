export type SiteReportRequestStatus =
  | "requested"
  | "quoted"
  | "accepted"
  | "in_progress"
  | "delivered"
  | "cancelled";

export interface SiteReportDefinition {
  key: string;
  name: string;
  description: string;
  price: number | null;
  pricing_rules: Record<string, unknown>;
  sort_order: number;
}

export const SITE_REPORTS_MIGRATION_HINT =
  "Run migration 023_site_report_addons.sql in Supabase.";

export const DEFAULT_SITE_REPORT_DEFINITIONS: SiteReportDefinition[] = [
  {
    key: "soil_report",
    name: "Soil Report",
    description:
      "Geotechnical soil classification for slab and foundation design, including AS 2870 site classification.",
    price: null,
    pricing_rules: {
      pricing_model: "manual_quote",
      future_parameters: ["land_size_sqm", "suburb", "postcode", "soil_zone"],
    },
    sort_order: 10,
  },
  {
    key: "site_survey",
    name: "Site Survey",
    description:
      "Contour and feature survey capturing levels, boundaries, services, and site features for design and approvals.",
    price: null,
    pricing_rules: {
      pricing_model: "manual_quote",
      future_parameters: [
        "land_size_sqm",
        "suburb",
        "postcode",
        "site_access",
      ],
    },
    sort_order: 20,
  },
];

export function isSiteReportsSchemaError(message: string) {
  return (
    message.includes("site_report_definitions") ||
    message.includes("site_report_requests") ||
    message.includes("site_report_request_status")
  );
}

export interface SiteReportPricingLand {
  id: string;
  suburb: string;
  postcode: string;
  land_size_sqm: number;
  frontage_meters: number;
  zoning: string;
}

export interface BuyerSiteReportRequest {
  id: string;
  report_definition_key: string;
  report_name: string;
  report_description: string;
  status: SiteReportRequestStatus;
  buyer_notes: string | null;
  quoted_price: number | null;
  requested_at: string;
  created_at: string;
  updated_at: string;
}

export const SITE_REPORT_STATUS_LABELS: Record<SiteReportRequestStatus, string> = {
  requested: "Requested",
  quoted: "Quoted",
  accepted: "Accepted",
  in_progress: "In progress",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function calculateReportPrice(
  report: Pick<SiteReportDefinition, "key" | "price" | "pricing_rules">,
  land: SiteReportPricingLand
): number | null {
  void report;
  void land;

  // TODO: Derive fixed report pricing from report.pricing_rules and land
  // parameters such as land_size_sqm, suburb/postcode, location, and soil zone.
  // Returning null keeps the current product flow on a manual quote basis.
  return null;
}
