"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Proposal = {
  id: string;
  package_name: string;
  base_price: number;
  status: string;
  created_at: string;
  builder: { full_name: string; company_name: string | null } | null;
  buyer: { full_name: string; company_name: string | null } | null;
  listing: { address: string; suburb: string; postcode: string } | null;
};

export function AdminProposalsManager() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/proposals", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load proposals.");
        setProposals(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return proposals;
    return proposals.filter((row) => {
      const builder =
        row.builder?.company_name || row.builder?.full_name || "";
      const buyer = row.buyer?.full_name || "";
      const listing = row.listing
        ? `${row.listing.address} ${row.listing.suburb}`
        : "";
      return (
        row.package_name.toLowerCase().includes(q) ||
        builder.toLowerCase().includes(q) ||
        buyer.toLowerCase().includes(q) ||
        listing.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
      );
    });
  }, [proposals, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Builder proposals</CardTitle>
        <CardDescription>
          Read-only overview of proposals sent to buyers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdminTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search package, builder, listing…"
        />
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No proposals found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Package</th>
                  <th className="py-2 pr-4 font-medium">Builder</th>
                  <th className="py-2 pr-4 font-medium">Listing</th>
                  <th className="py-2 pr-4 font-medium">Price</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-black/[0.04]">
                    <td className="py-3 pr-4">{row.package_name}</td>
                    <td className="py-3 pr-4">
                      {row.builder?.company_name ||
                        row.builder?.full_name ||
                        "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {row.listing
                        ? `${row.listing.address}, ${row.listing.suburb}`
                        : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      ${Number(row.base_price).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <Badge variant="outline">{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
