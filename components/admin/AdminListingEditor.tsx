"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AdminListingEditorProps = {
  listingId: string;
};

export function AdminListingEditor({ listingId }: AdminListingEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    address: "",
    suburb: "",
    postcode: "",
    price: "",
    land_size_sqm: "",
    frontage_meters: "",
    zoning: "",
    status: "available",
  });

  useEffect(() => {
    fetch(`/api/admin/listings/${listingId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load listing.");
        setForm({
          address: data.address ?? "",
          suburb: data.suburb ?? "",
          postcode: data.postcode ?? "",
          price: String(data.price ?? ""),
          land_size_sqm: String(data.land_size_sqm ?? ""),
          frontage_meters: String(data.frontage_meters ?? ""),
          zoning: data.zoning ?? "",
          status: data.status ?? "available",
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [listingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: form.address,
        suburb: form.suburb,
        postcode: form.postcode,
        price: Number(form.price),
        land_size_sqm: Number(form.land_size_sqm),
        frontage_meters: Number(form.frontage_meters),
        zoning: form.zoning,
        status: form.status,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Save failed.");
      setSaving(false);
      return;
    }

    router.push("/admin/listings");
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading listing…</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit listing</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="suburb">Suburb</Label>
            <Input
              id="suburb"
              value={form.suburb}
              onChange={(e) => setForm({ ...form, suburb: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postcode">Postcode</Label>
            <Input
              id="postcode"
              value={form.postcode}
              onChange={(e) => setForm({ ...form, postcode: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="land_size_sqm">Land size (m²)</Label>
            <Input
              id="land_size_sqm"
              type="number"
              value={form.land_size_sqm}
              onChange={(e) =>
                setForm({ ...form, land_size_sqm: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frontage_meters">Frontage (m)</Label>
            <Input
              id="frontage_meters"
              type="number"
              value={form.frontage_meters}
              onChange={(e) =>
                setForm({ ...form, frontage_meters: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zoning">Zoning</Label>
            <Input
              id="zoning"
              value={form.zoning}
              onChange={(e) => setForm({ ...form, zoning: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="available">Available</option>
              <option value="under_offer">Under offer</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          {error && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Link href="/admin/listings" className="inline-flex items-center text-sm text-link">
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
