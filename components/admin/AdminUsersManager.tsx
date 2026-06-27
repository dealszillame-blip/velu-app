"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { Badge } from "@/components/ui/badge";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone_number: string | null;
  company_name: string | null;
  created_at: string;
  has_profile?: boolean;
};

const ROLES = ["all", "buyer", "builder", "agent", "pending_agent", "admin"] as const;

export function AdminUsersManager() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<(typeof ROLES)[number]>("all");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to load users.");
      setUsers([]);
    } else {
      setUsers(Array.isArray(data) ? data : []);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (!q) return true;
      return (
        user.full_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.company_name?.toLowerCase().includes(q) ?? false) ||
        (user.phone_number?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [users, search, roleFilter]);

  async function updateRole(id: string, role: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "Update failed.");
      return;
    }
    setUsers((rows) =>
      rows.map((row) =>
        row.id === id ? { ...row, role, has_profile: true } : row
      )
    );
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-background">
      <div className="p-4">
        <AdminTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name, email, company…"
        >
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as (typeof ROLES)[number])
            }
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role === "all" ? "All roles" : role}
              </option>
            ))}
          </select>
        </AdminTableToolbar>
      </div>
      {loading ? (
        <p className="p-6 text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="p-6 text-sm leading-relaxed text-destructive">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          No users match your filters.
        </p>
      ) : (
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-black/[0.04]">
                <td className="px-4 py-3">
                  {user.full_name}
                  {!user.has_profile && (
                    <Badge variant="outline" className="ml-2 text-amber-600">
                      No profile
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">{user.email || "—"}</td>
                <td className="px-4 py-3">{user.company_name ?? "—"}</td>
                <td className="px-4 py-3">{user.phone_number ?? "—"}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    className="rounded-lg border border-input bg-background px-2 py-1 text-sm"
                  >
                    <option value="buyer">buyer</option>
                    <option value="builder">builder</option>
                    <option value="agent">agent</option>
                    <option value="pending_agent">pending_agent</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${user.id}`} className="text-link">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
