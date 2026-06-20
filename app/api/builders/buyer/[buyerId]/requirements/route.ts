import { NextResponse } from "next/server";
import type { BuyerBuildRequirements } from "@/lib/buyer-requirements";
import { buildRequirementsSchema } from "@/lib/buyer-requirements";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ buyerId: string }> }
) {
  const { buyerId } = await params;
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

  if (profile?.role !== "builder") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase.rpc("get_buyer_build_requirements", {
    p_buyer_id: buyerId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || Object.keys(data as object).length === 0) {
    return NextResponse.json({ build_requirements: null });
  }

  const parsed = buildRequirementsSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ build_requirements: null });
  }

  return NextResponse.json({
    build_requirements: parsed.data as BuyerBuildRequirements,
  });
}
