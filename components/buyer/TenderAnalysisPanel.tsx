"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList } from "lucide-react";
import type { TenderAnalysisReport, TenderFinding } from "@/lib/tender-analysis";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<TenderFinding["severity"], string> = {
  gap: "border-amber-200 bg-amber-50 text-amber-800",
  watch: "border-blue-200 bg-blue-50 text-blue-800",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function TenderAnalysisPanel() {
  const [report, setReport] = useState<TenderAnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/buyer/tender-analysis")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Failed to analyse tender.");
        setReport(data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="py-6 text-sm text-muted-foreground">Analysing tenders…</p>
    );
  }

  if (error) {
    return (
      <p className="py-6 text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="mb-2 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">Tender report</p>
        </div>
        <p className="text-sm text-muted-foreground">{report.summary}</p>
        {report.overall_recommendations.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {report.overall_recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {report.proposal_reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Register land and wait for builder packages, then run this report
          again.
        </p>
      ) : (
        report.proposal_reports.map((item) => (
          <div
            key={item.proposal_id}
            className="rounded-xl border border-border p-4"
          >
            <p className="font-medium">{item.package_name}</p>
            <p className="text-sm text-muted-foreground">{item.builder_name}</p>
            <div className="mt-3 space-y-2">
              {item.findings.map((finding) => (
                <div
                  key={finding.title}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    SEVERITY_STYLES[finding.severity]
                  )}
                >
                  <p className="font-medium">{finding.title}</p>
                  <p className="mt-0.5 opacity-90">{finding.detail}</p>
                </div>
              ))}
            </div>
            {item.recommended_updates.length > 0 ? (
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Recommended updates
                </p>
                <ul className="space-y-1 text-sm">
                  {item.recommended_updates.map((update) => (
                    <li key={update} className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      {update}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No extra updates flagged for this pack.
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
