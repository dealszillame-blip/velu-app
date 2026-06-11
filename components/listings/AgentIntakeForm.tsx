"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ZONING_OPTIONS } from "@/lib/map/config";

export function AgentIntakeForm() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [landSize, setLandSize] = useState("");
  const [frontage, setFrontage] = useState("");
  const [zoning, setZoning] = useState("R2");
  const [status, setStatus] = useState<"available" | "under_offer">("available");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        price: Number(price),
        land_size_sqm: Number(landSize),
        frontage_meters: Number(frontage),
        zoning,
        status,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Failed to create listing.");
      setLoading(false);
      return;
    }

    router.push(`/agent/listings/${data.id}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New vacant land listing</CardTitle>
        <CardDescription>
          Six fields — address is geocoded automatically via OpenStreetMap.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Street address</Label>
            <Input
              id="address"
              required
              placeholder="42 Banksia St, Ingleburn NSW 2565"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (AUD)</Label>
            <Input
              id="price"
              type="number"
              min={1}
              required
              placeholder="595000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landSize">Land size (m²)</Label>
            <Input
              id="landSize"
              type="number"
              min={1}
              step="0.01"
              required
              placeholder="450"
              value={landSize}
              onChange={(e) => setLandSize(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frontage">Frontage (m)</Label>
            <Input
              id="frontage"
              type="number"
              min={1}
              step="0.01"
              required
              placeholder="15.5"
              value={frontage}
              onChange={(e) => setFrontage(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoning">Zoning</Label>
            <Select
              value={zoning}
              onValueChange={(v) => v && setZoning(v)}
            >
              <SelectTrigger id="zoning" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZONING_OPTIONS.map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Initial status</Label>
            <Select
              value={status}
              onValueChange={(v) =>
                v && setStatus(v as "available" | "under_offer")
              }
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="under_offer">Under offer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create listing"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
