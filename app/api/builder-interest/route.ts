import { NextResponse } from "next/server";
import { builderPrelaunchSchema } from "@/lib/builder-interest";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = builderPrelaunchSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = await createServiceClient();
  const { data, error } = await admin
    .from("builder_prelaunch_interest")
    .insert({
      full_name: body.data.full_name,
      email: body.data.email.trim().toLowerCase(),
      phone: body.data.phone ?? null,
      company_name: body.data.company_name ?? null,
      service_area: body.data.service_area,
      specialties: body.data.specialties,
      notes: body.data.notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, ok: true });
}
