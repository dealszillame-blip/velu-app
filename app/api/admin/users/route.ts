import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.admin
    .from("profiles")
    .select("id, role, full_name, phone_number, company_name, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
