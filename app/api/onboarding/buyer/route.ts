import { NextResponse } from "next/server";
import { z } from "zod";
import { buildRequirementsSchema } from "@/lib/buyer-requirements";
import { createClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  full_name: z.string().min(2),
  phone_number: z.string().optional(),
  build_requirements: buildRequirementsSchema.optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = onboardingSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    role: "buyer",
    full_name: body.data.full_name,
    phone_number: body.data.phone_number ?? null,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (body.data.build_requirements) {
    const { error: buyerProfileError } = await supabase
      .from("buyer_profiles")
      .upsert({
        id: user.id,
        build_requirements: body.data.build_requirements,
        requirements_completed_at: new Date().toISOString(),
      });

    if (buyerProfileError) {
      return NextResponse.json(
        { error: buyerProfileError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, redirect: "/buyer/map" });
}
