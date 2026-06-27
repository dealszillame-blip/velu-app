import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  enabled: z.boolean(),
});

type RouteContext = { params: Promise<{ key: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const { key } = await context.params;

  const body = patchSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("feature_flags")
    .update({ enabled: body.data.enabled, updated_at: new Date().toISOString() })
    .eq("key", key)
    .select("key, enabled, module, description, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
