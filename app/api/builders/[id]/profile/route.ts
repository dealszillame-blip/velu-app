import { NextResponse } from "next/server";
import type {
  BuilderPublicInclusion,
  BuilderPublicOffer,
  BuilderPublicProfile,
} from "@/lib/builder-profile";
import type { InclusionItem } from "@/lib/proposal-breakdown";
import { createClient } from "@/lib/supabase/server";

function asInclusionItems(value: unknown): InclusionItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is InclusionItem =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as InclusionItem).item === "string"
  );
}

function offerMeta(parts: Array<string | number | null | undefined>): string | null {
  const text = parts.filter((part) => part != null && part !== "").join(" · ");
  return text || null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc("get_builder_public_profile", {
    p_builder_id: id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const profile = data as BuilderPublicProfile;

  const { data: notices } = await supabase
    .from("builder_compliance_notices")
    .select("id, title, body, severity, issued_at, source")
    .eq("builder_id", id)
    .eq("is_active", true)
    .order("issued_at", { ascending: false });

  const [packagesResult, designsResult, proposalsResult] = await Promise.all([
    supabase
      .from("builder_published_packages")
      .select(
        "id, name, description, bedrooms, bathrooms, living_area_sqm, indicative_price, storeys"
      )
      .eq("builder_id", id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("builder_designs")
      .select(
        "id, name, description, base_price, bedrooms, bathrooms, storeys, floor_area_sqm"
      )
      .eq("builder_id", id)
      .eq("is_active", true),
    user
      ? supabase
          .from("builder_proposals")
          .select("id, package_name, inclusions, inclusion_items")
          .eq("builder_id", id)
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as never[], error: null }),
  ]);

  const offers: BuilderPublicOffer[] = [
    ...((packagesResult.data ?? []) as Array<{
      id: string;
      name: string;
      description: string | null;
      bedrooms: number | null;
      bathrooms: number | null;
      living_area_sqm: number | null;
      indicative_price: number | null;
      storeys: string | null;
    }>).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.indicative_price,
      meta: offerMeta([
        item.storeys ? `${item.storeys} storey` : null,
        item.bedrooms != null ? `${item.bedrooms} bed` : null,
        item.bathrooms != null ? `${item.bathrooms} bath` : null,
        item.living_area_sqm != null ? `${item.living_area_sqm} m²` : null,
      ]),
    })),
    ...((designsResult.data ?? []) as Array<{
      id: string;
      name: string;
      description: string | null;
      base_price: number | null;
      bedrooms: number | null;
      bathrooms: number | null;
      storeys: number | null;
      floor_area_sqm: number | null;
    }>).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.base_price,
      meta: offerMeta([
        item.storeys != null ? `${item.storeys} storey` : null,
        item.bedrooms != null ? `${item.bedrooms} bed` : null,
        item.bathrooms != null ? `${item.bathrooms} bath` : null,
        item.floor_area_sqm != null ? `${item.floor_area_sqm} m²` : null,
      ]),
    })),
  ];

  const inclusions: BuilderPublicInclusion[] = (
    (proposalsResult.data ?? []) as Array<{
      id: string;
      package_name: string;
      inclusions: string | null;
      inclusion_items: unknown;
    }>
  )
    .map((row) => ({
      id: row.id,
      title: row.package_name,
      summary: row.inclusions,
      items: asInclusionItems(row.inclusion_items),
    }))
    .filter((row) => row.summary || row.items.length > 0);

  const profileWithNotices = {
    ...profile,
    notices: notices ?? [],
    offers,
    inclusions,
  };

  if (!profile.profile_published) {
    if (user?.id !== id) {
      return NextResponse.json({ error: "Profile not published" }, { status: 404 });
    }
  }

  return NextResponse.json(profileWithNotices);
}
