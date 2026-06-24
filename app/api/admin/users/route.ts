import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const [{ data: authData, error: authError }, { data: profiles, error: profileError }] =
    await Promise.all([
      auth.admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      auth.admin
        .from("profiles")
        .select("id, role, full_name, phone_number, company_name, created_at"),
    ]);

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const rows = (authData?.users ?? [])
    .map((user) => {
      const profile = profileMap.get(user.id);
      const metadata = user.user_metadata ?? {};
      return {
        id: user.id,
        email: user.email ?? "",
        full_name:
          profile?.full_name ??
          (typeof metadata.full_name === "string" ? metadata.full_name : null) ??
          user.email?.split("@")[0] ??
          "Unknown",
        role: profile?.role ?? "buyer",
        phone_number:
          profile?.phone_number ??
          (typeof metadata.phone_number === "string" ? metadata.phone_number : null),
        company_name: profile?.company_name ?? null,
        created_at: profile?.created_at ?? user.created_at,
        has_profile: Boolean(profile),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    );

  return NextResponse.json(rows);
}
