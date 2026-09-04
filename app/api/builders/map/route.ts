import { NextResponse } from "next/server";
import type { MapBuilder } from "@/lib/builder-map";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("get_builders_for_map");

  if (error) {
    const message = error.message.includes("get_builders_for_map")
      ? "Builder map is not set up yet. Run migration 024_buyer_hub_expansion.sql in Supabase."
      : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json((data ?? []) as MapBuilder[]);
}
