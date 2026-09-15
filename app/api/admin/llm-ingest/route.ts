import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { llmIngestSchema } from "@/lib/llm/ingest";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const parsed = llmIngestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload did not match the LLM ingest schema.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const admin = auth.admin;

  if (payload.kind === "tender") {
    const { error } = await admin.from("tender_knowledge_base").upsert(
      {
        key: payload.key,
        package_name: payload.package_name,
        region: payload.region,
        builder_type: payload.builder_type ?? null,
        construction_grade: payload.construction_grade ?? null,
        bedrooms: payload.bedrooms ?? null,
        bathrooms: payload.bathrooms ?? null,
        storeys: payload.storeys ?? null,
        living_area_sqm: payload.living_area_sqm ?? null,
        base_price: payload.base_price,
        estimated_build_weeks: payload.estimated_build_weeks ?? null,
        inclusions: payload.inclusions ?? null,
        notes: payload.notes ?? null,
        source_name: payload.source_name ?? "LLM ingest",
        is_active: true,
      },
      { onConflict: "key" }
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, kind: "tender", key: payload.key });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("company_name", payload.company_name)
    .eq("role", "builder")
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      {
        error: `No builder profile found for company "${payload.company_name}". Create the user first, then ingest again.`,
      },
      { status: 404 }
    );
  }

  const { error } = await admin
    .from("builder_profiles")
    .update({
      license_number: payload.license_number,
      license_verify_url: payload.license_verify_url,
      is_license_valid: payload.is_license_valid ?? true,
      license_verified_at: payload.is_license_valid ? new Date().toISOString() : null,
      google_rating: payload.google_rating,
      google_review_count: payload.google_review_count,
      builder_type: payload.builder_type,
      last_property_sold_address: payload.last_property_sold_address,
      last_property_sold_at: payload.last_property_sold_at,
      avg_delay_weeks: payload.avg_delay_weeks,
      headline: payload.headline,
      website_url: payload.website_url,
      anchor_address: payload.anchor_address,
      service_radius_km: payload.service_radius_km,
    })
    .eq("id", profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (payload.notices?.length) {
    await admin.from("builder_compliance_notices").insert(
      payload.notices.map((notice) => ({
        builder_id: profile.id,
        title: notice.title,
        body: notice.body,
        severity: notice.severity,
        issued_at: notice.issued_at ?? null,
        source: "llm_ingest",
        is_active: true,
      }))
    );
  }

  return NextResponse.json({ ok: true, kind: "builder", builder_id: profile.id });
}
