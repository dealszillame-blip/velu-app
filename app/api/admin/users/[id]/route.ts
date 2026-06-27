import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  role: z.enum(["buyer", "builder", "agent", "admin", "pending_agent"]),
  full_name: z.string().min(2).optional(),
  phone_number: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
  agency_licence_number: z.string().nullable().optional(),
  agency_licence_expiry: z.string().nullable().optional(),
  rejection_reason: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const { id } = await context.params;

  const { data: authUser, error: userError } =
    await auth.admin.auth.admin.getUserById(id);

  if (userError || !authUser.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: profile } = await auth.admin
    .from("profiles")
    .select(
      "id, role, full_name, phone_number, company_name, agency_licence_number, agency_licence_expiry, avatar_url, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  const metadata = authUser.user.user_metadata ?? {};

  return NextResponse.json({
    id,
    email: authUser.user.email ?? "",
    email_confirmed_at: authUser.user.email_confirmed_at ?? null,
    last_sign_in_at: authUser.user.last_sign_in_at ?? null,
    created_at: authUser.user.created_at,
    role: profile?.role ?? "buyer",
    full_name:
      profile?.full_name ??
      (typeof metadata.full_name === "string" ? metadata.full_name : null) ??
      authUser.user.email?.split("@")[0] ??
      "Unknown",
    phone_number: profile?.phone_number ?? null,
    company_name: profile?.company_name ?? null,
    agency_licence_number: profile?.agency_licence_number ?? null,
    agency_licence_expiry: profile?.agency_licence_expiry ?? null,
    avatar_url: profile?.avatar_url ?? null,
    has_profile: Boolean(profile),
    rejection_reason:
      typeof metadata.rejection_reason === "string"
        ? metadata.rejection_reason
        : null,
    profile_created_at: profile?.created_at ?? null,
    profile_updated_at: profile?.updated_at ?? null,
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

  const { data: existing } = await auth.admin
    .from("profiles")
    .select("id, full_name")
    .eq("id", id)
    .maybeSingle();

  let fullName = body.data.full_name ?? existing?.full_name;

  if (!fullName) {
    const { data: authUser } = await auth.admin.auth.admin.getUserById(id);
    const metadata = authUser.user?.user_metadata ?? {};
    fullName =
      (typeof metadata.full_name === "string" ? metadata.full_name : null) ??
      authUser.user?.email?.split("@")[0] ??
      "Velu user";
  }

  const { data, error } = await auth.admin
    .from("profiles")
    .upsert({
      id,
      role: body.data.role,
      full_name: fullName,
      phone_number: body.data.phone_number,
      company_name: body.data.company_name,
      agency_licence_number: body.data.agency_licence_number,
      agency_licence_expiry: body.data.agency_licence_expiry,
    })
    .select(
      "id, role, full_name, phone_number, company_name, agency_licence_number, agency_licence_expiry, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.data.rejection_reason !== undefined) {
    const { data: authUser } = await auth.admin.auth.admin.getUserById(id);
    const existingMeta = authUser.user?.user_metadata ?? {};
    await auth.admin.auth.admin.updateUserById(id, {
      user_metadata: {
        ...existingMeta,
        rejection_reason: body.data.rejection_reason,
      },
    });
  }

  const { data: authUser } = await auth.admin.auth.admin.getUserById(id);
  const metadata = authUser.user?.user_metadata ?? {};

  return NextResponse.json({
    ...data,
    email: authUser.user?.email ?? "",
    email_confirmed_at: authUser.user?.email_confirmed_at ?? null,
    last_sign_in_at: authUser.user?.last_sign_in_at ?? null,
    has_profile: true,
    rejection_reason:
      typeof metadata.rejection_reason === "string"
        ? metadata.rejection_reason
        : null,
  });
}
