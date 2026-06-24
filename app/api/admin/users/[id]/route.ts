import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  role: z.enum(["buyer", "builder", "agent", "admin", "pending_agent"]),
  full_name: z.string().min(2).optional(),
  phone_number: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

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
    })
    .select("id, role, full_name, phone_number, company_name, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: authUser } = await auth.admin.auth.admin.getUserById(id);

  return NextResponse.json({
    ...data,
    email: authUser.user?.email ?? "",
    has_profile: true,
  });
}
