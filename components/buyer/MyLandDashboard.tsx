"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BuyerOwnedLandForm } from "@/components/buyer/BuyerOwnedLandForm";
import { MyLandParcelCard } from "@/components/buyer/MyLandParcelCard";
import { SavedLandSketch } from "@/components/buyer/SavedLandSketch";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import type { BuyerOwnedLand } from "@/lib/buyer-land";
import type { BoundarySide } from "@/lib/buyer-requirements";

export function MyLandDashboard() {
  const router = useRouter();
  const [parcels, setParcels] = useState<BuyerOwnedLand[]>([]);
  const [savedSides, setSavedSides] = useState<BoundarySide[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    Promise.all([
      fetch("/api/buyer/land").then((res) => res.json()),
      fetch("/api/buyer/requirements").then((res) => res.json()),
    ])
      .then(([data, requirements]) => {
        setParcels(Array.isArray(data) ? data : []);
        const sides = requirements?.build_requirements?.boundary_sides;
        setSavedSides(Array.isArray(sides) ? sides : []);
      })
      .catch(() => {
        setParcels([]);
        setSavedSides([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

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
          {savedSides.length >= 4 ? (
            <SavedLandSketch
              sides={savedSides}
              description="This is the sketch saved with your block. Your builder sees the same drawing and side order."
            />
          ) : null}
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
