"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ProposalFormProps = {
  listingId: string;
};

function Textarea({
  id,
  placeholder,
  value,
  onChange,
  rows = 3,
}: {
  id: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "flex w-full resize-none rounded-xl border-0 bg-muted/60 px-3 py-2.5 text-sm",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
    />
  );
}

export function ProposalForm({ listingId }: ProposalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    package_name: "",
    base_price: "",
    inclusions: "",
    estimated_build_weeks: "",
    notes: "",
  });

  function set(key: keyof typeof form) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        land_listing_id: listingId,
        package_name: form.package_name,
        base_price: Number(form.base_price),
        inclusions: form.inclusions || undefined,
        estimated_build_weeks: form.estimated_build_weeks
          ? Number(form.estimated_build_weeks)
          : undefined,
        notes: form.notes || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Failed to submit proposal");
      setLoading(false);
      return;
    }

    router.push("/builder/proposals");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Package identity */}
      <div className="space-y-4">
        <p className="label-caps">Package details</p>
        <div className="space-y-2">
          <Label htmlFor="package_name">Design / package name</Label>
          <Input
            id="package_name"
            required
            placeholder="e.g. The Camden 240"
            value={form.package_name}
            onChange={(e) => set("package_name")(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="base_price">Total price (AUD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="base_price"
                type="number"
                required
                min={1}
                placeholder="650000"
                value={form.base_price}
                onChange={(e) => set("base_price")(e.target.value)}
                className="pl-6"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated_build_weeks">Build time (weeks)</Label>
            <Input
              id="estimated_build_weeks"
              type="number"
              min={1}
              placeholder="32"
              value={form.estimated_build_weeks}
              onChange={(e) => set("estimated_build_weeks")(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4 border-t border-black/[0.06] pt-5">
        <p className="label-caps">What&apos;s included</p>

        <div className="space-y-2">
          <Label htmlFor="inclusions">Inclusions</Label>
          <Textarea
            id="inclusions"
            placeholder="Stone benchtops, ducted AC, landscaping allowance, double garage…"
            value={form.inclusions}
            onChange={set("inclusions")}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes for buyer</Label>
          <Textarea
            id="notes"
            placeholder="Fixed-price contract, HIA standard terms, 10-year structural warranty…"
            value={form.notes}
            onChange={set("notes")}
            rows={2}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="h-12 w-full rounded-full text-base">
        {loading ? "Submitting…" : "Submit proposal"}
      </Button>
    </form>
  );
}
