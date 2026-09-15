import type { ProposalRow } from "@/lib/proposals";
import { formatProposalPrice } from "@/lib/proposals";

export type StoredTender = {
  id: string;
  key: string | null;
  package_name: string;
  builder_type: string | null;
  construction_grade: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  storeys: number | null;
  living_area_sqm: number | null;
  base_price: number;
  estimated_build_weeks: number | null;
  inclusions: string | null;
  notes: string | null;
  source_name: string | null;
};

export type KnowledgeMatch = {
  proposal_id: string;
  builder_name: string;
  package_name: string;
  current_price: number;
  benchmark_name: string;
  benchmark_price: number;
  price_delta_pct: number;
  headline: string;
  notes: string[];
};

export type KnowledgeCompareReport = {
  generated_at: string;
  method: "deterministic" | "llm";
  summary: string;
  matches: KnowledgeMatch[];
};

function similar(a: StoredTender, proposal: ProposalRow): number {
  const specs = proposal.home_specs ?? {};
  let score = 0;
  if (specs.bedrooms != null && a.bedrooms != null) {
    score += specs.bedrooms === a.bedrooms ? 4 : Math.max(0, 3 - Math.abs(specs.bedrooms - a.bedrooms));
  }
  if (specs.storeys != null && a.storeys != null) {
    score += specs.storeys === a.storeys ? 3 : 0;
  }
  if (specs.bathrooms != null && a.bathrooms != null) {
    score += Math.abs(specs.bathrooms - a.bathrooms) <= 0.5 ? 2 : 0;
  }
  return score;
}

export function compareAgainstStoredTenders(
  proposals: ProposalRow[],
  stored: StoredTender[]
): KnowledgeCompareReport {
  const active = stored.filter((row) => row.base_price > 0);
  const comparable = proposals.filter((p) =>
    ["pending", "viewed", "accepted"].includes(p.status)
  );

  const matches: KnowledgeMatch[] = comparable.map((proposal) => {
    const ranked = [...active].sort(
      (a, b) => similar(b, proposal) - similar(a, proposal)
    );
    const benchmark = ranked[0];
    if (!benchmark) {
      return {
        proposal_id: proposal.id,
        builder_name: proposal.builder_name ?? "Builder",
        package_name: proposal.package_name,
        current_price: proposal.base_price,
        benchmark_name: "No stored tender",
        benchmark_price: 0,
        price_delta_pct: 0,
        headline: "No past tender in the knowledge base to compare.",
        notes: [],
      };
    }

    const delta = (proposal.base_price - Number(benchmark.base_price)) / Number(benchmark.base_price);
    const notes: string[] = [];
    if (delta > 0.12) {
      notes.push(
        `${formatProposalPrice(proposal.base_price)} is ${Math.round(delta * 100)}% above the stored ${benchmark.package_name} benchmark.`
      );
    } else if (delta < -0.08) {
      notes.push(
        `${formatProposalPrice(proposal.base_price)} is ${Math.abs(Math.round(delta * 100))}% below the stored cohort — confirm what was left out.`
      );
    } else {
      notes.push("Price sits inside the stored SW Sydney cohort for a similar spec.");
    }

    if (
      benchmark.estimated_build_weeks &&
      proposal.estimated_build_weeks &&
      proposal.estimated_build_weeks > benchmark.estimated_build_weeks + 4
    ) {
      notes.push(
        `Programme is ${proposal.estimated_build_weeks} weeks vs ${benchmark.estimated_build_weeks} weeks in the stored tender.`
      );
    }

    const headline =
      delta > 0.12
        ? "Above the stored tender range — ask for a written variation list."
        : delta < -0.08
          ? "Cheaper than the stored cohort — check inclusions."
          : "In line with past tenders on file.";

    return {
      proposal_id: proposal.id,
      builder_name: proposal.builder_name ?? "Builder",
      package_name: proposal.package_name,
      current_price: proposal.base_price,
      benchmark_name: benchmark.package_name,
      benchmark_price: Number(benchmark.base_price),
      price_delta_pct: Math.round(delta * 100),
      headline,
      notes,
    };
  });

  const expensive = matches.filter((row) => row.price_delta_pct > 12).length;
  let summary = "No live packages to compare against stored tenders.";
  if (matches.length > 0) {
    summary =
      expensive > 0
        ? `Compared ${matches.length} live package${matches.length === 1 ? "" : "s"} to the Velu knowledge base. ${expensive} sit above the stored cohort.`
        : `Compared ${matches.length} live package${matches.length === 1 ? "" : "s"} to stored SW Sydney tenders. Prices sit inside the historical range.`;
  }

  return {
    generated_at: new Date().toISOString(),
    method: "deterministic",
    summary,
    matches,
  };
}
