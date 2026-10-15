"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NearbyBuildersPanel } from "@/components/buyer/NearbyBuildersPanel";
import { buttonVariants } from "@/components/ui/button";
import type { BuyerOwnedLand } from "@/lib/buyer-land";
import { cn } from "@/lib/utils";

export function BuyerBuilders() {
  const [parcels, setParcels] = useState<BuyerOwnedLand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/buyer/land")
      .then((res) => res.json())
      .then((data) => setParcels(Array.isArray(data) ? data : []))
      .catch(() => setParcels([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading your land…</p>;
  }

  if (parcels.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6">
        <p className="font-medium">Add land first</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Builders are listed for a block you have registered.
        </p>
        <Link
          href="/buyer/my-land"
          className={cn(buttonVariants({ size: "sm" }), "mt-4 rounded-full")}
        >
          Add land
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {parcels.map((parcel) => (
        <section key={parcel.id} className="space-y-3">
          <div>
            <h2 className="text-lg font-medium">{parcel.address}</h2>
            <p className="text-sm text-muted-foreground">
              {parcel.suburb} {parcel.postcode}
            </p>
          </div>
          <NearbyBuildersPanel parcel={parcel} />
        </section>
      ))}
    </div>
  );
}
