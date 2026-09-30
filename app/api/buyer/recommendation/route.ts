import { NextResponse } from "next/server";
import { normalizeBuildRequirements } from "@/lib/buyer-requirements";
import { maybeNarrateWithLlm, RECOMMEND_NARRATOR } from "@/lib/llm/ingest";
import {
  recommendProposals,
  recommendationNarrationPrompt,
} from "@/lib/proposal-recommendation";
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

  const [{ data: proposals }, { data: requirementsRow }] = await Promise.all([
    supabase.rpc("get_proposals_for_buyer", { p_buyer_id: user.id }),
    supabase
      .from("buyer_profiles")
      .select("build_requirements")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const requirements = requirementsRow?.build_requirements
    ? normalizeBuildRequirements(requirementsRow.build_requirements)
    : null;

  const proposalRows = (Array.isArray(proposals) ? proposals : []) as ProposalRow[];
  const report = recommendProposals(proposalRows, requirements);

  if (!report.recommended) {
    return NextResponse.json({
      ...report,
      llm: { used: false, provider: null, error: null },
    });
  }

  const llm = await maybeNarrateWithLlm(
    recommendationNarrationPrompt(report, requirements, proposalRows),
    {
      systemInstruction: RECOMMEND_NARRATOR,
      maxOutputTokens: 2048,
      temperature: 0.35,
    }
  );

  return NextResponse.json({
    ...report,
    summary: llm.text ?? report.summary,
    llm: {
      used: Boolean(llm.text),
      provider: llm.provider,
      error: llm.text ? null : llm.error,
    },
  });
}
