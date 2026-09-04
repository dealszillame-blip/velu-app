import { NextResponse } from "next/server";
import { DEFAULT_ARCHITECTS, type ArchitectDirectoryItem } from "@/lib/architects";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("architect_directory")
    .select("key, name, description, specialty, service_area, website_url, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json(DEFAULT_ARCHITECTS);
  }

  return NextResponse.json(
    (data?.length ? data : DEFAULT_ARCHITECTS) as ArchitectDirectoryItem[]
  );
}
