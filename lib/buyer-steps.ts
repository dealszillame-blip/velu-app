import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type BuyerStepId = "land" | "builders" | "proposals" | "contract" | "build" | "messages";

export type BuyerAccess = Record<BuyerStepId, boolean>;

const STEP_HREF: Record<BuyerStepId, string> = {
  land: "/buyer/my-land",
  builders: "/buyer/builders",
  proposals: "/buyer/compare",
  contract: "/buyer/contract",
  build: "/buyer/builds",
  messages: "/buyer/messages",
};

const ORDER: BuyerStepId[] = ["land", "builders", "proposals", "contract", "build"];

export function buyerStepHref(step: BuyerStepId): string {
  return STEP_HREF[step];
}

export async function loadBuyerAccess(userId: string): Promise<BuyerAccess> {
  const supabase = await createClient();

  const [land, inquiries, proposals, projects] = await Promise.all([
    supabase
      .from("land_listings")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId)
      .eq("source", "buyer_owned"),
    supabase
      .from("builder_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId),
    supabase.from("builder_proposals").select("status").eq("buyer_id", userId),
    supabase
      .from("construction_projects")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId),
  ]);

  const hasLand = (land.count ?? 0) > 0;
  const hasInvite = (inquiries.count ?? 0) > 0;
  const proposalRows = proposals.data ?? [];
  const hasProposal = proposalRows.length > 0;
  const hasAccepted = proposalRows.some((row) => row.status === "accepted");
  const hasProject = (projects.count ?? 0) > 0;

  return {
    land: true,
    builders: hasLand,
    proposals: hasLand && (hasInvite || hasProposal),
    contract: hasAccepted || hasProject,
    build: hasProject,
    messages: hasInvite || hasProposal || hasProject,
  };
}

export function openBuyerHref(access: BuyerAccess): string {
  const open = [...ORDER].reverse().find((step) => access[step]);
  return STEP_HREF[open ?? "land"];
}

export async function redirectUnlessBuyerStep(step: BuyerStepId): Promise<void> {
  const { user } = await requireRole(["buyer"]);
  const access = await loadBuyerAccess(user.id);
  if (!access[step]) {
    redirect(openBuyerHref(access));
  }
}
