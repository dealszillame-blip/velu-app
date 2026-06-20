"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { NearbyBuildersPanel } from "@/components/buyer/NearbyBuildersPanel";
import { SegmentControl } from "@/components/shared/SegmentControl";
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

type ParcelTab = "overview" | "builders";

type MyLandParcelCardProps = {
  parcel: BuyerOwnedLand;
};

export function MyLandParcelCard({ parcel }: MyLandParcelCardProps) {
  const [tab, setTab] = useState<ParcelTab>("overview");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-4 w-4 text-primary" />
              {parcel.address}
            </CardTitle>
            <CardDescription>
              {parcel.suburb} {parcel.postcode} · {parcel.land_size_sqm}m² ·{" "}
              {parcel.zoning}
            </CardDescription>
          </div>
          <Badge variant="outline" className="rounded-full gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Builders notified
          </Badge>
        </div>
        <SegmentControl
          className="mt-4"
          options={[
            { value: "overview", label: "Overview" },
            { value: "builders", label: "Builders in area" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </CardHeader>
      <CardContent className="pt-0">
        {tab === "overview" ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
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
          </div>
        ) : (
          <NearbyBuildersPanel parcel={parcel} />
        )}
      </CardContent>
    </Card>
  );
}
