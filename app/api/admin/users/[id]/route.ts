import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/guard";

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

  const { data, error } = await auth.admin
    .from("profiles")
    .update(body.data)
    .eq("id", id)
    .select("id, role, full_name, phone_number, company_name, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
