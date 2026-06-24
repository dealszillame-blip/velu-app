"use client";

import { useEffect, useState } from "react";
import { formatSpecialties, type BuilderPrelaunchInterest } from "@/lib/builder-interest";

export function AdminBuilderInterestManager() {
  const [rows, setRows] = useState<BuilderPrelaunchInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/builder-interest");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to load submissions.");
      setRows([]);
    } else {
      setRows(Array.isArray(data) ? data : []);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: BuilderPrelaunchInterest["status"]) {
    const res = await fetch(`/api/admin/builder-interest/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Update failed.");
      return;
    }
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, status } : row))
    );
  }

  async function remove(id: string) {
    if (!confirm("Delete this submission?")) return;
    const res = await fetch(`/api/admin/builder-interest/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Delete failed.");
      return;
    }
    setRows((current) => current.filter((row) => row.id !== id));
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pre-launch builder submissions yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div
          key={row.id}
          className="rounded-2xl border border-border bg-background p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                {row.full_name}
                {row.company_name ? ` · ${row.company_name}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {row.email}
                {row.phone ? ` · ${row.phone}` : ""}
              </p>
            </div>
            <select
              value={row.status}
              onChange={(e) =>
                updateStatus(
                  row.id,
                  e.target.value as BuilderPrelaunchInterest["status"]
                )
              }
              className="rounded-lg border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="new">new</option>
              <option value="contacted">contacted</option>
              <option value="invited">invited</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Service area:</span>{" "}
              {row.service_area}
            </p>
            <p>
              <span className="text-muted-foreground">Specialties:</span>{" "}
              {formatSpecialties(row.specialties)}
            </p>
          </div>
          {row.notes && (
            <p className="mt-3 text-sm text-muted-foreground">{row.notes}</p>
          )}
          <button
            type="button"
            className="mt-4 text-sm text-destructive"
            onClick={() => remove(row.id)}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
