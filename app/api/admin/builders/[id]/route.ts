import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  is_onboarded: z.boolean().optional(),
  onboarding_status: z
    .enum([
      "licence_pending",
      "insurance_pending",
      "designs_pending",
      "approval_pending",
      "onboarded",
    ])
    .optional(),
  is_license_valid: z.boolean().optional(),
  insurance_verified: z.boolean().optional(),
  profile_published: z.boolean().optional(),
  onboarding_notes: z.string().nullable().optional(),
  license_number: z.string().min(1).optional(),
  license_expiry: z.string().nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const { id } = await context.params;

  const { data: builder, error } = await auth.admin
    .from("builder_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const { data: profile } = await auth.admin
    .from("profiles")
    .select("id, full_name, company_name, phone_number")
    .eq("id", id)
    .single();

  const { data: authUser } = await auth.admin.auth.admin.getUserById(id);

  return NextResponse.json({
    ...builder,
    profile: profile
      ? {
          ...profile,
          email: authUser.user?.email ?? "",
        }
      : null,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const { id } = await context.params;

  const body = patchSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { ...body.data };

  if (body.data.is_onboarded === true) {
    updates.onboarded_at = new Date().toISOString();
    if (!body.data.onboarding_status) {
      updates.onboarding_status = "onboarded";
    }
  }

  const { data, error } = await auth.admin
    .from("builder_profiles")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
