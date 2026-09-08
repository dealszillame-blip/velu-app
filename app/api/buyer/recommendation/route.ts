import { NextResponse } from "next/server";
import { normalizeBuildRequirements } from "@/lib/buyer-requirements";
import { recommendProposals } from "@/lib/proposal-recommendation";
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

  return NextResponse.json(
    recommendProposals(
      (Array.isArray(proposals) ? proposals : []) as ProposalRow[],
      requirements
    )
  );
}
