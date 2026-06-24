import type { SupabaseClient } from "@supabase/supabase-js";
import { formatAdminApiError } from "@/lib/admin/errors";

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone_number: string | null;
  company_name: string | null;
  created_at: string;
  has_profile: boolean;
};

type AuthUserLike = {
  id: string;
  email?: string | null;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
};

type RpcAuthUser = {
  id: string;
  email: string | null;
  created_at: string;
  raw_user_meta_data: Record<string, unknown> | null;
};

function mergeAdminUserRows(
  authUsers: AuthUserLike[],
  profiles: Array<{
    id: string;
    role: string;
    full_name: string;
    phone_number: string | null;
    company_name: string | null;
    created_at: string;
  }>
): AdminUserRow[] {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return authUsers
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
        created_at: profile?.created_at ?? user.created_at ?? new Date(0).toISOString(),
        has_profile: Boolean(profile),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

export async function listAdminUsers(admin: SupabaseClient): Promise<{
  rows: AdminUserRow[];
  error?: string;
}> {
  const [{ data: authData, error: authError }, { data: profiles, error: profileError }] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin
        .from("profiles")
        .select("id, role, full_name, phone_number, company_name, created_at"),
    ]);

  if (profileError) {
    return { rows: [], error: profileError.message };
  }

  let authUsers: AuthUserLike[] | undefined = authData?.users;

  if (authError || !authUsers) {
    const { data: rpcUsers, error: rpcError } = await admin.rpc("admin_list_auth_users");

    if (!rpcError && Array.isArray(rpcUsers) && rpcUsers.length > 0) {
      authUsers = (rpcUsers as RpcAuthUser[]).map((user) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: user.raw_user_meta_data ?? {},
      }));
    } else {
      return {
        rows: [],
        error: formatAdminApiError(
          authError?.message ?? rpcError?.message ?? "Failed to load users."
        ),
      };
    }
  }

  return {
    rows: mergeAdminUserRows(authUsers, profiles ?? []),
  };
}

export async function countAdminUsers(admin: SupabaseClient): Promise<number> {
  const { rows, error } = await listAdminUsers(admin);
  if (error) {
    return 0;
  }
  return rows.length;
}
