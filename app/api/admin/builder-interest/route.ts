import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.admin
    .from("builder_prelaunch_interest")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    const message = error.message.includes("builder_prelaunch_interest")
      ? "Run migration 021_builder_prelaunch_and_admin.sql in Supabase."
      : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
