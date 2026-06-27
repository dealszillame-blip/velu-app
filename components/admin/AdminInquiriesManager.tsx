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

type Inquiry = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_preview: string | null;
  buyer: { full_name: string; company_name: string | null } | null;
  builder: { full_name: string; company_name: string | null } | null;
  listing: { address: string; suburb: string; postcode: string } | null;
};

export function AdminInquiriesManager() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/inquiries", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load inquiries.");
        setInquiries(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inquiries;
    return inquiries.filter((row) => {
      const buyer =
        row.buyer?.company_name || row.buyer?.full_name || "";
      const builder =
        row.builder?.company_name || row.builder?.full_name || "";
      const listing = row.listing
        ? `${row.listing.address} ${row.listing.suburb}`
        : "";
      return (
        buyer.toLowerCase().includes(q) ||
        builder.toLowerCase().includes(q) ||
        listing.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
      );
    });
  }, [inquiries, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buyer–builder inquiries</CardTitle>
        <CardDescription>
          Read-only overview of platform messaging threads for support.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdminTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search buyer, builder, listing…"
        />
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No inquiries found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Buyer</th>
                  <th className="py-2 pr-4 font-medium">Builder</th>
                  <th className="py-2 pr-4 font-medium">Listing</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Last message</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-black/[0.04]">
                    <td className="py-3 pr-4">
                      {row.buyer?.full_name ?? "—"}
                    </td>
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
                      <Badge variant="outline">
                        {row.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {row.last_message_preview ?? "—"}
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
