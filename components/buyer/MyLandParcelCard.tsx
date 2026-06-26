"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, FileText, MapPin } from "lucide-react";
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
import {
  SITE_REPORT_STATUS_LABELS,
  type SiteReportRequestStatus,
} from "@/lib/site-reports";
import { cn } from "@/lib/utils";

type ParcelTab = "overview" | "builders";

type MyLandParcelCardProps = {
  parcel: BuyerOwnedLand;
};

const SITE_REPORT_STATUS_STYLES: Record<SiteReportRequestStatus, string> = {
  requested: "border-amber-200 bg-amber-50 text-amber-700",
  quoted: "border-blue-200 bg-blue-50 text-blue-700",
  accepted: "border-primary/30 bg-primary/10 text-primary",
  in_progress: "border-purple-200 bg-purple-50 text-purple-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-muted bg-muted text-muted-foreground",
};

export function MyLandParcelCard({ parcel }: MyLandParcelCardProps) {
  const [tab, setTab] = useState<ParcelTab>("overview");
  const siteReports = parcel.site_reports ?? [];

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
          <div className="space-y-4">
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

            {siteReports.length > 0 ? (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Requested site reports</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {siteReports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-lg border border-border bg-background/80 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">
                            {report.report_name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Pricing to be provided after review.
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0",
                            SITE_REPORT_STATUS_STYLES[report.status]
                          )}
                        >
                          {SITE_REPORT_STATUS_LABELS[report.status]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <NearbyBuildersPanel parcel={parcel} />
        )}
      </CardContent>
    </Card>
  );
}
