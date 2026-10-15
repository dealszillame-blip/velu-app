export type UserRole =
  | "buyer"
  | "builder"
  | "agent"
  | "admin"
  | "pending_agent"
  | "report_provider";

export type ListingStatus = "available" | "under_offer" | "sold";

export const CONSTRUCTION_STAGES = [
  "contract",
  "slab",
  "frame",
  "lockup",
  "fixing",
  "completion",
] as const;

export type ConstructionMilestone = (typeof CONSTRUCTION_STAGES)[number];

export type ProposalStatus =
  | "draft"
  | "pending"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired"
  | "withdrawn";

export const LIVE_PROPOSAL_STATUSES: ProposalStatus[] = [
  "draft",
  "pending",
  "viewed",
  "accepted",
  "rejected",
];

export const EDITABLE_PROPOSAL_STATUSES: ProposalStatus[] = [
  "pending",
  "viewed",
];

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone_number: string | null;
  company_name: string | null;
  avatar_url: string | null;
  agency_licence_number: string | null;
  agency_licence_expiry: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuilderProfile {
  id: string;
  license_number: string;
  license_expiry: string | null;
  is_license_valid: boolean;
  insurance_verified: boolean;
  service_radius_km: number;
  anchor_address: string | null;
  is_onboarded: boolean;
  onboarding_status: string;
  subscription_tier: string;
}

export const ROLE_HOME: Record<UserRole, string> = {
  buyer: "/buyer/map",
  builder: "/builder/dashboard",
  agent: "/agent/listings",
  admin: "/admin/dashboard",
  pending_agent: "/agent/listings",
  report_provider: "/provider/reports",
};

export const MILESTONE_LABELS: Record<ConstructionMilestone, string> = {
  contract: "Contract",
  slab: "Slab",
  frame: "Frame",
  lockup: "Lock-up",
  fixing: "Fixing",
  completion: "Handover",
};

export const MILESTONE_SUMMARIES: Record<ConstructionMilestone, string> = {
  contract: "The build contract is in place and work can start.",
  slab: "The concrete slab is poured.",
  frame: "The structural frame is standing.",
  lockup: "The home is closed in: roof, walls, and windows.",
  fixing: "Internals, fixtures, and finishes are underway.",
  completion: "Practical completion. The home is handed over.",
};
