import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { data: builderRows, error: builderError } = await auth.admin
    .from("builder_profiles")
    .select(
      "id, is_onboarded, profile_published, anchor_address, service_radius_km, license_number, google_rating"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (builderError) {
    return NextResponse.json({ error: builderError.message }, { status: 500 });
  }

  const ids = (builderRows ?? []).map((row) => row.id);
  const { data: profiles } = ids.length
    ? await auth.admin
        .from("profiles")
        .select("id, full_name, company_name")
        .in("id", ids)
    : { data: [] as { id: string; full_name: string; company_name: string | null }[] };

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const rows = (builderRows ?? []).map((builder) => ({
    ...builder,
    profiles: profileMap.get(builder.id) ?? null,
  }));

  return NextResponse.json(rows);
}
