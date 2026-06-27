"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FeatureFlag = {
  key: string;
  enabled: boolean;
  module: string;
  description: string | null;
  updated_at: string;
};

export function AdminFeatureFlagsManager() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/flags", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load flags.");
        setFlags(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggle(key: string, enabled: boolean) {
    setToggling(key);
    const res = await fetch(`/api/admin/flags/${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "Update failed.");
      setToggling(null);
      return;
    }
    setFlags((rows) =>
      rows.map((row) => (row.key === key ? { ...row, enabled } : row))
    );
    setToggling(null);
  }

  const grouped = flags.reduce<Record<string, FeatureFlag[]>>((acc, flag) => {
    const module = flag.module || "other";
    if (!acc[module]) acc[module] = [];
    acc[module].push(flag);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature flags</CardTitle>
        <CardDescription>
          Toggle platform features without a deployment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([module, moduleFlags]) => (
              <div key={module}>
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {module}
                </h3>
                <div className="space-y-3">
                  {moduleFlags.map((flag) => (
                    <div
                      key={flag.key}
                      className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{flag.key}</span>
                          <Badge variant={flag.enabled ? "default" : "outline"}>
                            {flag.enabled ? "On" : "Off"}
                          </Badge>
                        </div>
                        {flag.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {flag.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={toggling === flag.key}
                        onClick={() => toggle(flag.key, !flag.enabled)}
                        className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        {toggling === flag.key
                          ? "Saving…"
                          : flag.enabled
                            ? "Disable"
                            : "Enable"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
