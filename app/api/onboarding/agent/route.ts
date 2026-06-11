import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  full_name: z.string().min(2),
  company_name: z.string().min(2),
  phone_number: z.string().optional(),
  agency_licence_number: z.string().nullable().optional(),
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

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    role: "agent",
    full_name: body.data.full_name,
    company_name: body.data.company_name,
    phone_number: body.data.phone_number ?? null,
    agency_licence_number: body.data.agency_licence_number ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, redirect: "/agent/listings" });
}
