import type { ProposalStatus } from "@/lib/types";

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
  status: ProposalStatus;
  created_at: string;
}

export interface CreateProposalInput {
  land_listing_id: string;
  package_name: string;
  base_price: number;
  inclusions?: string;
  estimated_build_weeks?: number;
  notes?: string;
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
    case "draft":
      return "Draft";
  }
}
