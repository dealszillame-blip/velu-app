"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { nextStatus, statusLabel, type MapListing } from "@/lib/listings";
import type { ListingStatus } from "@/lib/types";

type ListingStatusToggleProps = {
  listingId: string;
  status: ListingStatus;
  size?: "sm" | "default";
};

export function ListingStatusToggle({
  listingId,
  status,
  size = "sm",
}: ListingStatusToggleProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = nextStatus(current);
  const isSold = current === "sold";

  async function advanceStatus() {
    if (isSold) return;

    setLoading(true);
    setError(null);

    const res = await fetch(`/api/listings/${listingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Update failed");
      setLoading(false);
      return;
    }

    setCurrent(next);
    setLoading(false);
    router.refresh();
  }

  if (isSold) {
    return <span className="text-xs text-muted-foreground">Sold</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        size={size}
        variant="outline"
        disabled={loading}
        onClick={advanceStatus}
      >
        {loading ? "Updating…" : `Mark ${statusLabel(next).toLowerCase()}`}
      </Button>
      {error && (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
