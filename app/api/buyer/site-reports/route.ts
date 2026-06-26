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

  if (profile?.role !== "buyer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("site_report_definitions")
    .select("key, name, description, price, pricing_rules, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    const message = error.message.includes("site_report_definitions")
      ? "Site report add-ons are not set up yet. Run migration 023_site_report_addons.sql in Supabase."
      : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
