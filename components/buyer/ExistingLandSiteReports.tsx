"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { SiteReportAddonSelector } from "@/components/buyer/SiteReportAddonSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BuyerSiteReportRequest } from "@/lib/site-reports";
import {
  DEFAULT_SITE_REPORT_DEFINITIONS,
  SITE_REPORT_STATUS_LABELS,
  type SiteReportDefinition,
  type SiteReportRequestStatus,
} from "@/lib/site-reports";
import { cn } from "@/lib/utils";

type ExistingLandSiteReportsProps = {
  listingId: string;
  siteReports: BuyerSiteReportRequest[];
  onUpdated?: () => void;
};

const SITE_REPORT_STATUS_STYLES: Record<SiteReportRequestStatus, string> = {
  requested: "border-amber-200 bg-amber-50 text-amber-700",
  quoted: "border-blue-200 bg-blue-50 text-blue-700",
  accepted: "border-primary/30 bg-primary/10 text-primary",
  in_progress: "border-purple-200 bg-purple-50 text-purple-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-muted bg-muted text-muted-foreground",
};

export function ExistingLandSiteReports({
  listingId,
  siteReports,
  onUpdated,
}: ExistingLandSiteReportsProps) {
  const [definitions, setDefinitions] = useState<SiteReportDefinition[]>(
    DEFAULT_SITE_REPORT_DEFINITIONS
  );
  const [definitionsLoading, setDefinitionsLoading] = useState(true);
  const [definitionsError, setDefinitionsError] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requestedKeys = useMemo(
    () => siteReports.map((report) => report.report_definition_key),
    [siteReports]
  );

  useEffect(() => {
    let isMounted = true;

    fetch("/api/buyer/site-reports")
      .then(async (res) => {
        const data = await res.json().catch(() => []);

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load add-on services.");
        }

        return Array.isArray(data) && data.length > 0
          ? data
          : DEFAULT_SITE_REPORT_DEFINITIONS;
      })
      .then((data) => {
        if (!isMounted) return;
        setDefinitions(data);
        setDefinitionsError(null);
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        setDefinitions(DEFAULT_SITE_REPORT_DEFINITIONS);
        setDefinitionsError(err.message);
      })
      .finally(() => {
        if (!isMounted) return;
        setDefinitionsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function toggleSiteReport(reportKey: string) {
    setSelectedKeys((current) =>
      current.includes(reportKey)
        ? current.filter((key) => key !== reportKey)
        : [...current, reportKey]
    );
  }

  async function handleSubmit() {
    if (selectedKeys.length === 0) return;

    setSubmitting(true);
    setSubmitError(null);

    const res = await fetch(`/api/buyer/land/${listingId}/site-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site_report_keys: selectedKeys,
        site_report_notes: notes.trim() || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSubmitError(data.error ?? "Failed to request site reports.");
      setSubmitting(false);
      return;
    }

    setSelectedKeys([]);
    setNotes("");
    setSubmitting(false);
    onUpdated?.();
  }

  const hasAvailableReports = definitions.some(
    (definition) => !requestedKeys.includes(definition.key)
  );

  return (
    <div className="space-y-4">
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
                    <p className="text-sm font-medium">{report.report_name}</p>
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

      {hasAvailableReports ? (
        <div className="space-y-3">
          <SiteReportAddonSelector
            idPrefix={`parcel-${listingId}`}
            definitions={definitions}
            loading={definitionsLoading}
            error={definitionsError}
            selectedKeys={selectedKeys}
            onToggle={toggleSiteReport}
            notes={notes}
            onNotesChange={setNotes}
            disabledKeys={requestedKeys}
          />

          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}

          <Button
            type="button"
            disabled={submitting || selectedKeys.length === 0}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting request…" : "Request selected reports"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
