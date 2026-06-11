export type UserRole =
  | "buyer"
  | "builder"
  | "agent"
  | "admin"
  | "pending_agent";

export type ListingStatus = "available" | "under_offer" | "sold";

export type ConstructionMilestone =
  | "contract"
  | "slab"
  | "frame"
  | "lockup"
  | "fixing"
  | "completion";

export type ProposalStatus =
  | "draft"
  | "pending"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired";

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
};

export const MILESTONE_LABELS: Record<ConstructionMilestone, string> = {
  contract: "Contract",
  slab: "Slab",
  frame: "Frame",
  lockup: "Lock-up",
  fixing: "Fixing",
  completion: "Handover",
};
