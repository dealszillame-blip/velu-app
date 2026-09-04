import type { BuyerBuildRequirements } from "@/lib/buyer-requirements";
import {
  houseTypeLabel,
  storeyLabel,
} from "@/lib/buyer-requirements";
import type { InclusionItem } from "@/lib/proposal-breakdown";
import type { ProposalRow } from "@/lib/proposals";
import { formatProposalPrice } from "@/lib/proposals";

export type TenderFinding = {
  severity: "gap" | "watch" | "ok";
  title: string;
  detail: string;
};

export type TenderProposalReport = {
  proposal_id: string;
  builder_name: string;
  package_name: string;
  findings: TenderFinding[];
  recommended_updates: string[];
};

export type TenderAnalysisReport = {
  generated_at: string;
  summary: string;
  proposal_reports: TenderProposalReport[];
  overall_recommendations: string[];
};

const PREMIUM_INCLUSION_HINTS = [
  "stone",
  "ducted",
  "solar",
  "warranty",
  "air conditioning",
  "alfresco",
];

function storeyCount(req: BuyerBuildRequirements): number | null {
  if (req.storeys === "ground_only") return 1;
  if (req.storeys === "ground_plus_one" || req.storeys === "two_storey") return 2;
  if (req.house_type === "single_storey") return 1;
  if (req.house_type === "double_storey") return 2;
  return null;
}

function includedItems(proposal: ProposalRow): InclusionItem[] {
  return (proposal.inclusion_items ?? []).filter((item) => item.included);
}

export function analyseTender(
  proposals: ProposalRow[],
  requirements: BuyerBuildRequirements | null
): TenderAnalysisReport {
  const proposalReports = proposals.map((proposal) => {
    const findings: TenderFinding[] = [];
    const recommendedUpdates: string[] = [];
    const specs = proposal.home_specs ?? {};
    const inclusions = includedItems(proposal);

    if (requirements) {
      if (specs.bedrooms != null && specs.bedrooms < requirements.bedrooms) {
        findings.push({
          severity: "gap",
          title: "Bedroom count is short",
          detail: `${proposal.builder_name ?? "Builder"} offers ${specs.bedrooms} bedrooms; your brief asks for ${requirements.bedrooms}.`,
        });
        recommendedUpdates.push(
          `Ask for a ${requirements.bedrooms}-bed layout or a variation price.`
        );
      } else if (specs.bedrooms != null) {
        findings.push({
          severity: "ok",
          title: "Bedrooms match",
          detail: `${specs.bedrooms} bedrooms vs your brief of ${requirements.bedrooms}.`,
        });
      }

      if (specs.bathrooms != null && specs.bathrooms < requirements.bathrooms) {
        findings.push({
          severity: "gap",
          title: "Bathroom count is short",
          detail: `${specs.bathrooms} bathrooms vs your brief of ${requirements.bathrooms}.`,
        });
        recommendedUpdates.push("Request an extra bathroom or ensuite variation.");
      }

      const wantedStoreys = storeyCount(requirements);
      if (wantedStoreys && specs.storeys != null && specs.storeys !== wantedStoreys) {
        findings.push({
          severity: "gap",
          title: "Storeys do not match the brief",
          detail: `Package is ${specs.storeys} storey vs ${storeyLabel(requirements.storeys)} / ${houseTypeLabel(requirements.house_type)}.`,
        });
      }

      if (requirements.granny_flat === "yes") {
        const mentionsGranny = [proposal.package_name, proposal.inclusions, proposal.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes("granny");
        if (!mentionsGranny) {
          findings.push({
            severity: "gap",
            title: "Granny flat not mentioned",
            detail: "Your brief includes a granny flat, but this package does not call it out.",
          });
          recommendedUpdates.push("Confirm whether a granny flat / studio can be added.");
        }
      }
    }

    const premiumHits = PREMIUM_INCLUSION_HINTS.filter((hint) =>
      inclusions.some((item) =>
        `${item.item} ${item.detail}`.toLowerCase().includes(hint)
      )
    );

    if (premiumHits.length === 0 && inclusions.length > 0) {
      findings.push({
        severity: "watch",
        title: "Few premium inclusions listed",
        detail: "Stone, solar, ducted AC or warranty items are not clearly included.",
      });
      recommendedUpdates.push("Request a written premium inclusions list before signing.");
    } else if (premiumHits.length > 0) {
      findings.push({
        severity: "ok",
        title: "Premium inclusions present",
        detail: `Called out: ${premiumHits.join(", ")}.`,
      });
    }

    if (!proposal.price_breakdown?.length) {
      findings.push({
        severity: "watch",
        title: "No price breakdown",
        detail: `Quoted ${formatProposalPrice(proposal.base_price)} as a lump sum with no line items.`,
      });
      recommendedUpdates.push("Ask for a site, kitchen, bathroom and contingency breakdown.");
    }

    if ((proposal.estimated_build_weeks ?? 0) > 40) {
      findings.push({
        severity: "watch",
        title: "Longer than typical programme",
        detail: `${proposal.estimated_build_weeks} weeks is above a 28–36 week volume-build range.`,
      });
    }

    if (findings.length === 0) {
      findings.push({
        severity: "ok",
        title: "No obvious gaps from the submitted pack",
        detail: "Still confirm site costs, soil class and variations in writing.",
      });
    }

    return {
      proposal_id: proposal.id,
      builder_name: proposal.builder_name ?? "Builder",
      package_name: proposal.package_name,
      findings,
      recommended_updates: recommendedUpdates,
    };
  });

  const gapCount = proposalReports.reduce(
    (sum, report) => sum + report.findings.filter((f) => f.severity === "gap").length,
    0
  );

  const overall: string[] = [];
  if (!requirements) {
    overall.push("Save your build requirements so the tender check can match bedrooms, bathrooms and house type.");
  }
  if (proposals.length < 2) {
    overall.push("Get at least two comparable packages before accepting.");
  }
  overall.push("Commission a soil report and site survey before locking a slab price.");
  if (gapCount > 0) {
    overall.push("Send the recommended updates back to builders as a written variation list.");
  }

  return {
    generated_at: new Date().toISOString(),
    summary:
      proposals.length === 0
        ? "No tenders to analyse yet."
        : `Reviewed ${proposals.length} package${proposals.length === 1 ? "" : "s"} and found ${gapCount} gap${gapCount === 1 ? "" : "s"} against your brief.`,
    proposal_reports: proposalReports,
    overall_recommendations: overall,
  };
}
