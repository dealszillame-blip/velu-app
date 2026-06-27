import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.admin
    .from("feature_flags")
    .select("key, enabled, module, description, updated_at")
    .order("module")
    .order("key");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
