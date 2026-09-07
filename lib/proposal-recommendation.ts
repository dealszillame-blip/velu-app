import type { BuyerBuildRequirements } from "@/lib/buyer-requirements";
import {
  houseTypeLabel,
  storeyLabel,
} from "@/lib/buyer-requirements";
import type { ProposalRow } from "@/lib/proposals";
import { formatProposalPrice } from "@/lib/proposals";

export type RankedProposal = {
  proposal_id: string;
  builder_name: string;
  package_name: string;
  base_price: number;
  score: number;
  headline: string;
  strengths: string[];
  gaps: string[];
};

export type RecommendationReport = {
  generated_at: string;
  recommended: RankedProposal | null;
  ranked: RankedProposal[];
  summary: string;
  next_steps: string[];
};

function wantedStoreys(req: BuyerBuildRequirements | null): number | null {
  if (!req) return null;
  if (req.storeys === "ground_only" || req.house_type === "single_storey") return 1;
  if (
    req.storeys === "ground_plus_one" ||
    req.storeys === "two_storey" ||
    req.house_type === "double_storey"
  ) {
    return 2;
  }
  return null;
}

function mentionsGranny(proposal: ProposalRow): boolean {
  const includedItems = (proposal.inclusion_items ?? []).filter((item) => item.included);
  if (
    includedItems.some((item) =>
      /granny|studio/.test(`${item.item} ${item.detail}`.toLowerCase())
    )
  ) {
    return true;
  }

  const haystack = [proposal.package_name, proposal.inclusions]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\bgranny\b/.test(haystack) || /\bstudio\b/.test(haystack);
}

function hasPremiumInclusions(proposal: ProposalRow): string[] {
  const hints = ["stone", "ducted", "solar", "warranty", "alfresco"];
  const text = [
    proposal.inclusions,
    ...(proposal.inclusion_items ?? [])
      .filter((item) => item.included)
      .map((item) => `${item.item} ${item.detail}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hints.filter((hint) => text.includes(hint));
}

function scoreProposal(
  proposal: ProposalRow,
  requirements: BuyerBuildRequirements | null,
  cheapest: number
): RankedProposal {
  let score = 40;
  const strengths: string[] = [];
  const gaps: string[] = [];
  const specs = proposal.home_specs ?? {};
  const builder = proposal.builder_name ?? "This builder";

  if (requirements) {
    if (specs.bedrooms != null) {
      const delta = specs.bedrooms - requirements.bedrooms;
      if (delta === 0) {
        score += 18;
        strengths.push(`${specs.bedrooms} bedrooms match your brief.`);
      } else if (delta > 0) {
        score += 10;
        strengths.push(`${specs.bedrooms} bedrooms — one more than you asked for.`);
      } else {
        score -= 20 * Math.abs(delta);
        gaps.push(
          `Only ${specs.bedrooms} bedrooms vs your brief of ${requirements.bedrooms}.`
        );
      }
    }

    if (specs.bathrooms != null) {
      const delta = specs.bathrooms - requirements.bathrooms;
      if (delta >= 0) {
        score += delta === 0 ? 12 : 7;
        strengths.push(`${specs.bathrooms} bathrooms vs your brief of ${requirements.bathrooms}.`);
      } else {
        score -= 12;
        gaps.push(
          `${specs.bathrooms} bathrooms is short of the ${requirements.bathrooms} you asked for.`
        );
      }
    }

    const storeys = wantedStoreys(requirements);
    if (storeys && specs.storeys != null) {
      if (specs.storeys === storeys) {
        score += 12;
        strengths.push(
          `${specs.storeys === 1 ? "Single-storey" : "Two-storey"} matches ${storeyLabel(requirements.storeys)} / ${houseTypeLabel(requirements.house_type)}.`
        );
      } else {
        score -= 16;
        gaps.push(
          `Package is ${specs.storeys} storey, but your brief is ${storeyLabel(requirements.storeys)}.`
        );
      }
    }

    if (requirements.granny_flat === "yes") {
      if (mentionsGranny(proposal)) {
        score += 14;
        strengths.push("Granny flat / studio is included or called out.");
      } else {
        score -= 18;
        gaps.push("Your brief includes a granny flat, but this package does not mention one.");
      }
    }

    if (requirements.car_spaces != null && specs.car_spaces != null) {
      if (specs.car_spaces >= requirements.car_spaces) {
        score += 6;
        strengths.push(`${specs.car_spaces} car spaces.`);
      } else {
        score -= 6;
        gaps.push(`Only ${specs.car_spaces} car spaces vs ${requirements.car_spaces} in your brief.`);
      }
    }
  }

  if (cheapest > 0) {
    const premium = (proposal.base_price - cheapest) / cheapest;
    if (premium <= 0.01) {
      score += 12;
      strengths.push(`Lowest lump sum at ${formatProposalPrice(proposal.base_price)}.`);
    } else if (premium <= 0.08) {
      score += 6;
      strengths.push(`Close to the cheapest quote (${formatProposalPrice(proposal.base_price)}).`);
    } else if (premium > 0.18) {
      score -= 8;
      gaps.push(
        `${formatProposalPrice(proposal.base_price)} is ${Math.round(premium * 100)}% above the cheapest package.`
      );
    }
  }

  const weeks = proposal.estimated_build_weeks ?? 0;
  if (weeks > 0 && weeks <= 34) {
    score += 8;
    strengths.push(`${weeks}-week programme is within a typical volume-build range.`);
  } else if (weeks > 40) {
    score -= 8;
    gaps.push(`${weeks} weeks is a long programme.`);
  }

  const premium = hasPremiumInclusions(proposal);
  if (premium.length >= 2) {
    score += 8;
    strengths.push(`Premium inclusions: ${premium.join(", ")}.`);
  } else if (premium.length === 0) {
    score -= 4;
    gaps.push("Few premium inclusions (stone, ducted AC, solar, warranty) are listed.");
  }

  if ((proposal.price_breakdown ?? []).length > 0) {
    score += 6;
    strengths.push("Includes a written price breakdown.");
  } else {
    gaps.push("Quoted as a lump sum with no line-item breakdown.");
  }

  if (gaps.length === 0) {
    score += 5;
  }

  score = Math.max(8, Math.min(98, Math.round(score)));

  const headline =
    gaps.length === 0
      ? `${builder} is a clean match on the numbers we can check.`
      : gaps.length === 1
        ? `${builder} is close, with one gap to confirm in writing.`
        : `${builder} needs ${gaps.length} clarifications before you accept.`;

  return {
    proposal_id: proposal.id,
    builder_name: builder,
    package_name: proposal.package_name,
    base_price: proposal.base_price,
    score,
    headline,
    strengths: strengths.slice(0, 4),
    gaps: gaps.slice(0, 4),
  };
}

export function recommendProposals(
  proposals: ProposalRow[],
  requirements: BuyerBuildRequirements | null
): RecommendationReport {
  const comparable = proposals.filter((p) =>
    ["pending", "viewed", "accepted"].includes(p.status)
  );
  const cheapest = Math.min(...comparable.map((p) => p.base_price), Number.POSITIVE_INFINITY);
  const ranked = comparable
    .map((proposal) =>
      scoreProposal(
        proposal,
        requirements,
        Number.isFinite(cheapest) ? cheapest : 0
      )
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.gaps.length - b.gaps.length ||
        a.base_price - b.base_price
    );

  const recommended = ranked[0] ?? null;
  const nextSteps: string[] = [];

  if (!requirements) {
    nextSteps.push("Save your build requirements so the recommendation can match bedrooms, bathrooms and house type.");
  }
  if (comparable.length < 2) {
    nextSteps.push("Load or wait for a second builder package so the ranking has something to compare.");
  }
  nextSteps.push("Commission a soil report and site survey before locking a slab price.");
  if (recommended?.gaps.length) {
    nextSteps.push(
      `Send ${recommended.builder_name} a written variation list: ${recommended.gaps[0]}`
    );
  }
  nextSteps.push("Message the recommended builder and one runner-up before you accept.");

  let summary = "No packages to rank yet.";
  if (recommended && ranked.length === 1) {
    summary = `Only one package is in. ${recommended.builder_name} scores ${recommended.score}/100, but get a second quote before deciding.`;
  } else if (recommended) {
    summary = `Velu recommends ${recommended.builder_name} — ${recommended.package_name} (${recommended.score}/100 fit) at ${formatProposalPrice(recommended.base_price)}.`;
  }

  return {
    generated_at: new Date().toISOString(),
    recommended,
    ranked,
    summary,
    next_steps: nextSteps,
  };
}
