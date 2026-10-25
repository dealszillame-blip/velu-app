"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { ArchitectHirePanel } from "@/components/buyer/ArchitectHirePanel";
import { ExistingLandSiteReports } from "@/components/buyer/ExistingLandSiteReports";
import { SegmentControl } from "@/components/shared/SegmentControl";
import { Button } from "@/components/ui/button";
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
  onDeleted?: () => void;
};

export function MyLandParcelCard({
  parcel,
  onReportsUpdated,
  onDeleted,
}: MyLandParcelCardProps) {
  const [tab, setTab] = useState<ParcelTab>("overview");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const siteReports = parcel.site_reports ?? [];

  async function deleteLand() {
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch(`/api/buyer/land?id=${parcel.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDeleteError(data.error ?? "Could not delete this land.");
      setDeleting(false);
      return;
    }
    setDeleting(false);
    onDeleted?.();
  }

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
            {parcel.suburb} {parcel.postcode} · {parcel.land_size_sqm}m²
            {parcel.frontage_meters != null
              ? ` · ${parcel.frontage_meters}m frontage`
              : ""}
            {parcel.depth_meters != null ? ` · ${parcel.depth_meters}m depth` : ""}
          </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              setDeleteError(null);
              setConfirmingDelete(true);
            }}
          >
            Delete
          </Button>
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
      <CardContent className="space-y-4 pt-0">
        {confirmingDelete ? (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium">Are you sure you want to delete it?</p>
            {deleteError ? (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-full"
                disabled={deleting}
                onClick={deleteLand}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={deleting}
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
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
