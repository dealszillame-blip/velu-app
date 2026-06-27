import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadActiveSiteReportDefinitions } from "@/lib/site-reports/server";

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

  try {
    const { definitions } = await loadActiveSiteReportDefinitions(supabase);
    return NextResponse.json(definitions);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load add-on services.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
