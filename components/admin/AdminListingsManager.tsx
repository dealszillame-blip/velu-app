"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AdminListing = {
  id: string;
  address: string;
  suburb: string;
  postcode: string;
  price: number;
  land_size_sqm: number;
  status: string;
  source: string | null;
};

export function AdminListingsManager() {
  const router = useRouter();
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/listings");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to load listings.");
      setListings([]);
    } else {
      setListings(Array.isArray(data) ? data : []);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this listing permanently?")) return;
    const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Delete failed.");
      return;
    }
    setListings((rows) => rows.filter((row) => row.id !== id));
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All listings</CardTitle>
        <CardDescription>
          Edit or remove land listings across agents and buyer-owned blocks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No listings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Address</th>
                  <th className="py-2 pr-4 font-medium">Suburb</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Source</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id} className="border-b border-black/[0.04]">
                    <td className="py-3 pr-4">{listing.address}</td>
                    <td className="py-3 pr-4">
                      {listing.suburb} {listing.postcode}
                    </td>
                    <td className="py-3 pr-4 capitalize">{listing.status}</td>
                    <td className="py-3 pr-4">{listing.source ?? "agent"}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/listings/${listing.id}`}
                          className="text-link"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="text-destructive"
                          onClick={() => remove(listing.id)}
                        >
                          Delete
                        </button>
                      </div>
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
