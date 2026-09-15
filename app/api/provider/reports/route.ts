import { NextResponse } from "next/server";
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

  if (profile?.role !== "report_provider") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("site_report_requests")
    .select(
      `
      id,
      report_definition_key,
      status,
      buyer_notes,
      quoted_price,
      assigned_provider_id,
      deliverable_url,
      provider_notes,
      result_summary,
      requested_at,
      created_at,
      updated_at,
      land_listings (address, suburb, postcode),
      site_report_definitions (name, description)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
