"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { ArchitectHirePanel } from "@/components/buyer/ArchitectHirePanel";
import { ExistingLandSiteReports } from "@/components/buyer/ExistingLandSiteReports";
import { SegmentControl } from "@/components/shared/SegmentControl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BuyerOwnedLand } from "@/lib/buyer-land";

type ParcelTab = "overview" | "reports" | "architects";

type MyLandParcelCardProps = {
  parcel: BuyerOwnedLand;
  onReportsUpdated?: () => void;
};

export function MyLandParcelCard({
  parcel,
  onReportsUpdated,
}: MyLandParcelCardProps) {
  const [tab, setTab] = useState<ParcelTab>("overview");
  const siteReports = parcel.site_reports ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-4 w-4 text-primary" />
            {parcel.address}
          </CardTitle>
          <CardDescription>
            {parcel.suburb} {parcel.postcode} · {parcel.land_size_sqm}m²
            {parcel.frontage_meters != null
              ? ` · ${parcel.frontage_meters}m frontage`
              : ""}
            {parcel.depth_meters != null ? ` · ${parcel.depth_meters}m depth` : ""}
          </CardDescription>
        </div>
        <SegmentControl
          className="mt-4"
          options={[
            { value: "overview", label: "Overview" },
            { value: "reports", label: "Site reports" },
            { value: "architects", label: "Architects" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </CardHeader>
      <CardContent className="pt-0">
        {tab === "overview" ? (
          <p className="text-sm text-muted-foreground">
            This block is registered.
          </p>
        ) : tab === "reports" ? (
          <ExistingLandSiteReports
            listingId={parcel.id}
            siteReports={siteReports}
            onUpdated={onReportsUpdated}
          />
        ) : (
          <ArchitectHirePanel listingId={parcel.id} />
        )}
      </CardContent>
    </Card>
  );
}
