import { NextResponse } from "next/server";
import { normalizeBuildRequirements } from "@/lib/buyer-requirements";
import { maybeNarrateWithLlm } from "@/lib/llm/ingest";
import { analyseTender } from "@/lib/tender-analysis";
import {
  compareAgainstStoredTenders,
  type StoredTender,
} from "@/lib/tender-knowledge";
import type { ProposalRow } from "@/lib/proposals";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "buyer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [{ data: proposals }, { data: requirementsRow }, { data: reports }, { data: stored }] =
    await Promise.all([
      supabase.rpc("get_proposals_for_buyer", { p_buyer_id: user.id }),
      supabase
        .from("buyer_profiles")
        .select("build_requirements")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("site_report_requests")
        .select("report_definition_key")
        .eq("buyer_id", user.id),
      supabase
        .from("tender_knowledge_base")
        .select(
          "id, key, package_name, builder_type, construction_grade, bedrooms, bathrooms, storeys, living_area_sqm, base_price, estimated_build_weeks, inclusions, notes, source_name"
        )
        .eq("is_active", true),
    ]);

  const requirements = requirementsRow?.build_requirements
    ? normalizeBuildRequirements(requirementsRow.build_requirements)
    : null;

  const requestedReports = (reports ?? []).map(
    (row: { report_definition_key: string }) => row.report_definition_key
  );

  const proposalRows = (Array.isArray(proposals) ? proposals : []) as ProposalRow[];
  const report = analyseTender(proposalRows, requirements, requestedReports);
  const knowledge = compareAgainstStoredTenders(
    proposalRows,
    (stored ?? []) as StoredTender[]
  );

  const llmPrompt = `${knowledge.summary}\n${knowledge.matches
    .map(
      (row) =>
        `${row.builder_name} ${row.package_name} at ${row.current_price} vs ${row.benchmark_name} ${row.benchmark_price}: ${row.headline}`
    )
    .join("\n")}`;
  const llmSummary = await maybeNarrateWithLlm(llmPrompt);

  return NextResponse.json({
    ...report,
    knowledge_compare: {
      ...knowledge,
      method: llmSummary ? "llm" : knowledge.method,
      summary: llmSummary ?? knowledge.summary,
    },
    legal_check: requestedReports.includes("legal_check")
      ? {
          status: "requested",
          detail: "A legal check is on file for this buyer. Wait for delivery before you accept.",
        }
      : {
          status: "missing",
          detail: "No legal check requested yet. Add it under My land → Site reports.",
        },
  });
}
