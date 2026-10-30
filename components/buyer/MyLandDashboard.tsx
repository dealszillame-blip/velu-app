"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BuyerOwnedLandForm } from "@/components/buyer/BuyerOwnedLandForm";
import { MyLandParcelCard } from "@/components/buyer/MyLandParcelCard";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import type { BuyerOwnedLand } from "@/lib/buyer-land";

export function MyLandDashboard() {
  const router = useRouter();
  const [parcels, setParcels] = useState<BuyerOwnedLand[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/buyer/land");
    const data = await res.json().catch(() => []);
    setParcels(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading your land…
          </CardContent>
        </Card>
      ) : parcels.length > 0 ? (
        <div className="space-y-4">
          <div>
            <p className="label-caps mb-1">Your registered land</p>
            <p className="text-sm text-muted-foreground">
              These blocks are saved. Register another below, or continue as a guest to look at other lots.
            </p>
          </div>
          <div className="grid gap-4">
            {parcels.map((parcel) => (
              <MyLandParcelCard
                key={parcel.id}
                parcel={parcel}
                onDeleted={() => {
                  load();
                  router.refresh();
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      <BuyerOwnedLandForm onSuccess={load} />
    </div>
  );
}
