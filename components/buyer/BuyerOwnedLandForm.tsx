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

type BuyerOwnedLandFormProps = {
  onSuccess?: () => void;
};

export function BuyerOwnedLandForm({ onSuccess }: BuyerOwnedLandFormProps) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [landSize, setLandSize] = useState("");
  const [frontage, setFrontage] = useState("");
  const [zoning, setZoning] = useState("R2");
  const [landValue, setLandValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/buyer/land", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        land_size_sqm: Number(landSize),
        frontage_meters: Number(frontage),
        zoning,
        land_value: landValue ? Number(landValue) : undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Failed to register your land.");
      setLoading(false);
      return;
    }

    setAddress("");
    setLandSize("");
    setFrontage("");
    setLandValue("");
    setLoading(false);
    onSuccess?.();
    router.push("/buyer/compare");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register your block</CardTitle>
        <CardDescription>
          Tell us about the land you already own. We geocode your address and
          notify matched builders in your area — same flow as when a lot sells
          on the map.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="owned-address">Street address</Label>
            <Input
              id="owned-address"
              required
              placeholder="7 Wattle Grove, Leumeah NSW 2560"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owned-landSize">Land size (m²)</Label>
            <Input
              id="owned-landSize"
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
            <Label htmlFor="owned-frontage">Frontage (m)</Label>
            <Input
              id="owned-frontage"
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
            <Label htmlFor="owned-zoning">Zoning</Label>
            <Select value={zoning} onValueChange={(v) => v && setZoning(v)}>
              <SelectTrigger id="owned-zoning" className="w-full">
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
            <Label htmlFor="owned-landValue">
              Estimated land value (optional)
            </Label>
            <Input
              id="owned-landValue"
              type="number"
              min={0}
              placeholder="650000"
              value={landValue}
              onChange={(e) => setLandValue(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Registering…" : "Find builders for my land"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
