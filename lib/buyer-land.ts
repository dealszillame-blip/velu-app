import type { BuyerSiteReportRequest } from "@/lib/site-reports";

export interface BuyerOwnedLand {
  id: string;
  address: string;
  suburb: string;
  postcode: string;
  land_size_sqm: number;
  frontage_meters: number;
  zoning: string;
  price: number;
  price_display: string | null;
  status: string;
  source: string;
  sold_at: string | null;
  created_at: string;
  proposal_count?: number;
  site_reports?: BuyerSiteReportRequest[];
}

export interface RegisterOwnedLandInput {
  address: string;
  land_size_sqm: number;
  frontage_meters: number;
  zoning: string;
  land_value?: number;
  notes?: string;
}
