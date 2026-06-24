import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { listAdminUsers } from "@/lib/admin/users";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { rows, error } = await listAdminUsers(auth.admin);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json(rows);
}
