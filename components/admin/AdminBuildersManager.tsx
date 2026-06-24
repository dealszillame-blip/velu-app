"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AdminBuilder = {
  id: string;
  is_onboarded: boolean;
  profile_published: boolean;
  anchor_address: string | null;
  service_radius_km: number;
  license_number: string | null;
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

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-background">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="px-4 py-3 font-medium">Builder</th>
            <th className="px-4 py-3 font-medium">Base</th>
            <th className="px-4 py-3 font-medium">Radius</th>
            <th className="px-4 py-3 font-medium">Onboarded</th>
            <th className="px-4 py-3 font-medium">Published</th>
            <th className="px-4 py-3 font-medium">Profile</th>
          </tr>
        </thead>
        <tbody>
          {builders.map((builder) => {
            const name =
              builder.profiles?.company_name ||
              builder.profiles?.full_name ||
              builder.id;
            return (
              <tr key={builder.id} className="border-b border-black/[0.04]">
                <td className="px-4 py-3">{name}</td>
                <td className="px-4 py-3">{builder.anchor_address ?? "—"}</td>
                <td className="px-4 py-3">{builder.service_radius_km} km</td>
                <td className="px-4 py-3">
                  {builder.is_onboarded ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3">
                  {builder.profile_published ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3">
                  {builder.profile_published ? (
                    <Link href={`/builders/${builder.id}`} className="text-link">
                      View
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
