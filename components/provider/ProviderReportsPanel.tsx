"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SITE_REPORT_STATUS_LABELS,
  type SiteReportRequestStatus,
} from "@/lib/site-reports";

type ProviderReport = {
  id: string;
  report_definition_key: string;
  status: SiteReportRequestStatus;
  buyer_notes: string | null;
  quoted_price: number | null;
  deliverable_url: string | null;
  provider_notes: string | null;
  land_listings:
    | { address: string; suburb: string; postcode: string }
    | { address: string; suburb: string; postcode: string }[]
    | null;
  site_report_definitions: { name: string; description: string } | { name: string; description: string }[] | null;
};

function first<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function ProviderReportsPanel() {
  const [rows, setRows] = useState<ProviderReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  function load() {
    fetch("/api/provider/reports")
      .then(async (res) => {
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data.error ?? "Failed to load requests.");
        setRows(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetch("/api/provider/reports")
      .then(async (res) => {
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data.error ?? "Failed to load requests.");
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function save(
    id: string,
    payload: {
      status?: SiteReportRequestStatus;
      quoted_price?: number | null;
      deliverable_url?: string | null;
      provider_notes?: string;
    }
  ) {
    setSavingId(id);
    const res = await fetch(`/api/provider/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSavingId(null);
    if (!res.ok) {
      setError(data.error ?? "Could not update request.");
      return;
    }
    load();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading requests…</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No soil, survey or inspection requests in your queue yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {rows.map((row) => {
        const listing = first(row.land_listings);
        const definition = first(row.site_report_definitions);
        return (
          <ProviderReportCard
            key={row.id}
            row={row}
            listing={listing}
            definition={definition}
            saving={savingId === row.id}
            onSave={save}
          />
        );
      })}
    </div>
  );
}

function ProviderReportCard({
  row,
  listing,
  definition,
  saving,
  onSave,
}: {
  row: ProviderReport;
  listing: { address: string; suburb: string; postcode: string } | null;
  definition: { name: string; description: string } | null;
  saving: boolean;
  onSave: (
    id: string,
    payload: {
      status?: SiteReportRequestStatus;
      quoted_price?: number | null;
      deliverable_url?: string | null;
      provider_notes?: string;
    }
  ) => void;
}) {
  const [notes, setNotes] = useState(row.provider_notes ?? "");
  const [url, setUrl] = useState(row.deliverable_url ?? "");
  const [price, setPrice] = useState(
    row.quoted_price != null ? String(row.quoted_price) : ""
  );

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{definition?.name ?? row.report_definition_key}</p>
          <p className="text-sm text-muted-foreground">
            {[listing?.address, listing?.suburb, listing?.postcode]
              .filter(Boolean)
              .join(", ") || "Land parcel"}
          </p>
        </div>
        <Badge variant="outline" className="rounded-full">
          {SITE_REPORT_STATUS_LABELS[row.status]}
        </Badge>
      </div>
      {row.buyer_notes ? (
        <p className="mb-3 text-sm text-muted-foreground">Buyer: {row.buyer_notes}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Quote (AUD)</Label>
          <Input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Deliverable URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Provider notes</Label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() =>
            onSave(row.id, {
              status: "quoted",
              quoted_price: price ? Number(price) : null,
              provider_notes: notes,
            })
          }
        >
          Send quote
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() =>
            onSave(row.id, {
              status: "in_progress",
              provider_notes: notes,
            })
          }
        >
          Mark in progress
        </Button>
        <Button
          size="sm"
          disabled={saving}
          onClick={() =>
            onSave(row.id, {
              status: "delivered",
              deliverable_url: url || null,
              provider_notes: notes,
            })
          }
        >
          Deliver report
        </Button>
      </div>
    </div>
  );
}
