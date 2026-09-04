"use client";

import { useEffect, useState } from "react";
import { Compass, PenTool } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ArchitectDirectoryItem, ArchitectRequest } from "@/lib/architects";
import { DEFAULT_ARCHITECTS } from "@/lib/architects";
import { cn } from "@/lib/utils";

type ArchitectHirePanelProps = {
  listingId: string;
};

export function ArchitectHirePanel({ listingId }: ArchitectHirePanelProps) {
  const [directory, setDirectory] = useState<ArchitectDirectoryItem[]>(
    DEFAULT_ARCHITECTS
  );
  const [requests, setRequests] = useState<ArchitectRequest[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetch("/api/buyer/architects").then((res) => res.json()),
      fetch(`/api/buyer/land/${listingId}/architects`).then((res) => res.json()),
    ])
      .then(([dir, reqs]) => {
        if (!mounted) return;
        if (Array.isArray(dir) && dir.length) setDirectory(dir);
        if (Array.isArray(reqs)) setRequests(reqs);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [listingId]);

  const requestedKeys = requests.map((request) => request.architect_key);

  async function handleSubmit() {
    if (selectedKeys.length === 0) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/buyer/land/${listingId}/architects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        architect_keys: selectedKeys,
        buyer_notes: notes.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not send architect request.");
      return;
    }

    setSelectedKeys([]);
    setNotes("");
    const refreshed = await fetch(`/api/buyer/land/${listingId}/architects`);
    const next = await refreshed.json().catch(() => []);
    setRequests(Array.isArray(next) ? next : []);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Request a custom-home architect or dual-occupancy designer. Pricing is
        quoted after they review the block.
      </p>

      {requests.length > 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-2 text-sm font-medium">Requested</p>
          <div className="flex flex-wrap gap-2">
            {requests.map((request) => (
              <Badge key={request.id} variant="outline" className="rounded-full">
                {request.architect_name} · {request.status}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {directory.map((item) => {
          const already = requestedKeys.includes(item.key);
          const selected = selectedKeys.includes(item.key);

          return (
            <div
              key={item.key}
              className={cn(
                "rounded-xl border bg-background/80 p-4",
                selected ? "border-primary" : "border-border"
              )}
            >
              <div className="flex items-start gap-2">
                <PenTool className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  {item.specialty ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.specialty}
                      {item.service_area ? ` · ${item.service_area}` : ""}
                    </p>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-4"
                variant={selected || already ? "default" : "outline"}
                disabled={already}
                onClick={() =>
                  setSelectedKeys((current) =>
                    current.includes(item.key)
                      ? current.filter((key) => key !== item.key)
                      : [...current, item.key]
                  )
                }
              >
                {already ? "Requested" : selected ? "Selected" : "Request intro"}
              </Button>
            </div>
          );
        })}
      </div>

      <textarea
        rows={3}
        value={notes}
        disabled={selectedKeys.length === 0}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Tell the architect about slope, dual occupancy, or a custom layout."
        className="flex w-full resize-none rounded-xl border-0 bg-muted/60 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        disabled={submitting || selectedKeys.length === 0}
        onClick={handleSubmit}
      >
        {submitting ? "Sending…" : "Request selected architects"}
      </Button>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Compass className="h-3.5 w-3.5" />
        Custom houses still go through licensed builders for construction.
      </p>
    </div>
  );
}
