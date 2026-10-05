import type { ProposalStatus } from "@/lib/types";
import { EDITABLE_PROPOSAL_STATUSES } from "@/lib/types";
import type {
  HomeSpecs,
  InclusionItem,
  PriceBreakdownLine,
} from "@/lib/proposal-breakdown";
import type { ContractType } from "@/lib/quote-structure";
import type { SiteReportRequestStatus } from "@/lib/site-reports";

export interface ProposalRow {
  id: string;
  builder_id: string;
  builder_name?: string;
  land_listing_id: string;
  listing_address?: string;
  listing_suburb?: string;
  package_name: string;
  base_price: number;
  inclusions: string | null;
  estimated_build_weeks: number | null;
  notes: string | null;
  contract_type?: ContractType | null;
  price_breakdown?: PriceBreakdownLine[];
  inclusion_items?: InclusionItem[];
  home_specs?: HomeSpecs;
  status: ProposalStatus;
  created_at: string;
  license_number?: string | null;
  license_verify_url?: string | null;
  is_license_valid?: boolean | null;
  insurance_verified?: boolean | null;
  site_costs_provisional?: boolean;
  soil_report_status?: SiteReportRequestStatus | null;
}

export interface CreateProposalInput {
  land_listing_id: string;
  package_name: string;
  base_price: number;
  contract_type: ContractType;
  inclusions?: string;
  estimated_build_weeks?: number;
  notes?: string;
  price_breakdown?: PriceBreakdownLine[];
  inclusion_items?: InclusionItem[];
  home_specs?: HomeSpecs;
}

export function formatProposalPrice(price: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function proposalStatusLabel(status: ProposalStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "viewed":
      return "Viewed";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Declined";
    case "expired":
      return "Expired";
    case "withdrawn":
      return "Withdrawn";
    case "draft":
      return "Draft";
  }
}

export function canEditProposal(status: ProposalStatus): boolean {
  return EDITABLE_PROPOSAL_STATUSES.includes(status);
}

export function isLiveProposalStatus(status: ProposalStatus): boolean {
  return status !== "withdrawn" && status !== "expired";
}
