"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { BuyerOwnedLandForm } from "@/components/buyer/BuyerOwnedLandForm";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BuyerOwnedLand } from "@/lib/buyer-land";
import { cn } from "@/lib/utils";

export function MyLandDashboard() {
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
              Builders in your area have been notified. Proposals appear on the
              compare page.
            </p>
          </div>
          <div className="grid gap-4">
            {parcels.map((parcel) => (
              <Card key={parcel.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-4 w-4 text-primary" />
                        {parcel.address}
                      </CardTitle>
                      <CardDescription>
                        {parcel.suburb} {parcel.postcode} · {parcel.land_size_sqm}
                        m² · {parcel.zoning}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="rounded-full gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Builders notified
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                  <p className="text-sm text-muted-foreground">
                    {parcel.proposal_count
                      ? `${parcel.proposal_count} proposal${parcel.proposal_count === 1 ? "" : "s"} received`
                      : "Waiting for builder proposals"}
                  </p>
                  <Link
                    href="/buyer/compare"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "rounded-full gap-2"
                    )}
                  >
                    View proposals
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <BuyerOwnedLandForm onSuccess={load} />
    </div>
  );
}
