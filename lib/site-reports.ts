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
  "Run migrations 023_site_report_addons.sql and 026_sydney_builder_hub.sql in Supabase.";

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
  {
    key: "third_party_inspection",
    name: "3rd party inspection",
    description:
      "Independent inspection of the build at nominated stages (slab, frame, lock-up, completion).",
    price: null,
    pricing_rules: { pricing_model: "manual_quote" },
    sort_order: 30,
  },
  {
    key: "bal_report",
    name: "BAL report",
    description:
      "Bushfire Attack Level assessment for BAL-rated construction and planning conditions.",
    price: null,
    pricing_rules: { pricing_model: "manual_quote" },
    sort_order: 40,
  },
  {
    key: "acoustic_report",
    name: "Acoustic report",
    description:
      "Noise assessment for lots near roads, rail or flight paths, including glazing recommendations.",
    price: null,
    pricing_rules: { pricing_model: "manual_quote" },
    sort_order: 50,
  },
  {
    key: "legal_check",
    name: "Legal check",
    description:
      "Contract and title review of the land and HIA/Master Builders package before you accept.",
    price: null,
    pricing_rules: { pricing_model: "manual_quote" },
    sort_order: 60,
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
  assigned_provider_id?: string | null;
  deliverable_url?: string | null;
  provider_notes?: string | null;
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
