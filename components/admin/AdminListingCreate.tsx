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

type AgentOption = { id: string; full_name: string; email: string };

export function AdminListingCreate() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    agent_id: "",
    address: "",
    price: "",
    land_size_sqm: "",
    frontage_meters: "",
    zoning: "R2",
    status: "available",
  });

  useEffect(() => {
    fetch("/api/admin/users")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) return;
        const agentUsers = (Array.isArray(data) ? data : []).filter(
          (u: { role: string }) => u.role === "agent" || u.role === "pending_agent"
        );
        setAgents(
          agentUsers.map((u: { id: string; full_name: string; email: string }) => ({
            id: u.id,
            full_name: u.full_name,
            email: u.email,
          }))
        );
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: form.agent_id || null,
        address: form.address,
        price: Number(form.price),
        land_size_sqm: Number(form.land_size_sqm),
        frontage_meters: Number(form.frontage_meters),
        zoning: form.zoning,
        status: form.status,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Create failed.");
      setSaving(false);
      return;
    }

    router.push(`/admin/listings/${data.id}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create listing</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="grid max-w-2xl gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="agent_id">Assign agent (optional)</Label>
            <select
              id="agent_id"
              value={form.agent_id}
              onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">No agent assigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.full_name} ({agent.email})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Full address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Example St, Suburb NSW 2000"
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
              {saving ? "Creating…" : "Create listing"}
            </Button>
            <Link
              href="/admin/listings"
              className="inline-flex items-center text-sm text-link"
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
