import { NextResponse } from "next/server";
import { notifyBuildersOnSold } from "@/lib/leads/notify-on-sold";
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

  if (profile?.role !== "builder") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: builderProfile } = await supabase
    .from("builder_profiles")
    .select("is_onboarded")
    .eq("id", user.id)
    .single();

  if (!builderProfile?.is_onboarded) {
    return NextResponse.json(
      { error: "Complete builder onboarding to view leads." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase.rpc("get_sold_leads_for_builder", {
    p_builder_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
