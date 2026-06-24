"use client";

import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  role: string;
  full_name: string;
  phone_number: string | null;
  company_name: string | null;
  created_at: string;
};

export function AdminUsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
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

  async function updateRole(id: string, role: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "Update failed.");
      return;
    }
    setUsers((rows) => rows.map((row) => (row.id === id ? { ...row, role } : row)));
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-background">
      {loading ? (
        <p className="p-6 text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="p-6 text-sm text-destructive">{error}</p>
      ) : (
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-black/[0.04]">
                <td className="px-4 py-3">{user.full_name}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
