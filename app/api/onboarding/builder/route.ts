import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocoding";

const schema = z.object({
  full_name: z.string().min(2),
  company_name: z.string().min(2),
  phone_number: z.string().optional(),
  license_number: z.string().min(3),
  license_expiry: z.string().nullable().optional(),
  anchor_address: z.string().min(3),
  service_radius_km: z.number().min(5).max(100),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    role: "builder",
    full_name: body.data.full_name,
    company_name: body.data.company_name,
    phone_number: body.data.phone_number ?? null,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const geocoded = await geocodeAddress(body.data.anchor_address);

  const { error: builderError } = await supabase.from("builder_profiles").upsert({
    id: user.id,
    license_number: body.data.license_number,
    license_expiry: body.data.license_expiry ?? null,
    is_license_valid: true,
    service_radius_km: body.data.service_radius_km,
    anchor_address: body.data.anchor_address,
    subscription_tier: "pro",
    is_onboarded: true,
    onboarding_status: "onboarded",
    onboarded_at: new Date().toISOString(),
  });

  if (builderError) {
    return NextResponse.json({ error: builderError.message }, { status: 500 });
  }

  if (geocoded) {
    const { error: geoError } = await supabase.rpc("set_builder_anchor_geom", {
      p_builder_id: user.id,
      p_longitude: geocoded.longitude,
      p_latitude: geocoded.latitude,
      p_address: geocoded.placeName,
    });

    if (geoError) {
      return NextResponse.json({ error: geoError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, redirect: "/builder/dashboard" });
}
