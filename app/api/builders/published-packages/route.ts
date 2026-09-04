import { NextResponse } from "next/server";
import {
  DEFAULT_PUBLISHED_PACKAGES,
  ingestBuilderPublishedPackages,
  type PublishedPackage,
} from "@/lib/published-packages";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  void ingestBuilderPublishedPackages;

  const { data, error } = await supabase
    .from("builder_published_packages")
    .select(
      "id, key, builder_id, storeys, name, description, bedrooms, bathrooms, living_area_sqm, indicative_price, source_name, source_url, sort_order"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return NextResponse.json(DEFAULT_PUBLISHED_PACKAGES);
  }

  return NextResponse.json(data as PublishedPackage[]);
}
