"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { Badge } from "@/components/ui/badge";

type AdminBuilder = {
  id: string;
  is_onboarded: boolean;
  profile_published: boolean;
  anchor_address: string | null;
  service_radius_km: number;
  license_number: string | null;
  onboarding_status: string;
  google_rating: number | null;
  profiles: {
    full_name: string;
    company_name: string | null;
  } | null;
};

export function AdminBuildersManager() {
  const [builders, setBuilders] = useState<AdminBuilder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "onboarded">("all");

  useEffect(() => {
    fetch("/api/admin/builders", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load builders.");
        setBuilders(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return builders.filter((builder) => {
      if (filter === "pending" && builder.is_onboarded) return false;
      if (filter === "onboarded" && !builder.is_onboarded) return false;
      const name =
        builder.profiles?.company_name ||
        builder.profiles?.full_name ||
        builder.id;
      if (!q) return true;
      return (
        name.toLowerCase().includes(q) ||
        (builder.anchor_address?.toLowerCase().includes(q) ?? false) ||
        (builder.license_number?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [builders, search, filter]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-background">
      <div className="p-4">
        <AdminTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search builders…"
        >
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "all" | "pending" | "onboarded")
            }
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All builders</option>
            <option value="pending">Pending onboarding</option>
            <option value="onboarded">Onboarded</option>
          </select>
        </AdminTableToolbar>
      </div>
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="px-4 py-3 font-medium">Builder</th>
            <th className="px-4 py-3 font-medium">Licence</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Published</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((builder) => {
            const name =
              builder.profiles?.company_name ||
              builder.profiles?.full_name ||
              builder.id;
            return (
              <tr key={builder.id} className="border-b border-black/[0.04]">
                <td className="px-4 py-3">
                  <div>{name}</div>
                  <div className="text-xs text-muted-foreground">
                    {builder.anchor_address ?? "No base address"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {builder.license_number ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {builder.is_onboarded ? (
                    <Badge variant="outline" className="text-green-700">
                      Onboarded
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600">
                      {builder.onboarding_status.replace(/_/g, " ")}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {builder.profile_published ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/builders/${builder.id}`}
                      className="text-link"
                    >
                      Manage
                    </Link>
                    {builder.profile_published && (
                      <Link
                        href={`/builders/${builder.id}`}
                        className="text-link"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <p className="p-6 text-sm text-muted-foreground">
          No builders match your filters.
        </p>
      )}
    </div>
  );
}
