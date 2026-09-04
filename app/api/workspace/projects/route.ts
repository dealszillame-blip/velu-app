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

  if (profile?.role !== "buyer" && profile?.role !== "builder") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: projects, error } = await supabase
    .from("construction_projects")
    .select(
      `
      id,
      buyer_id,
      builder_id,
      current_stage,
      land_listing_id,
      created_at,
      land_listings (address, suburb)
    `
    )
    .or(`buyer_id.eq.${user.id},builder_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(projects ?? []);
}
