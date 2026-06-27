"use client";

import { CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { SiteReportDefinition } from "@/lib/site-reports";
import { cn } from "@/lib/utils";

type SiteReportAddonSelectorProps = {
  definitions: SiteReportDefinition[];
  loading?: boolean;
  error?: string | null;
  selectedKeys: string[];
  onToggle: (reportKey: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  disabledKeys?: string[];
  disableNotes?: boolean;
  idPrefix: string;
};

export function SiteReportAddonSelector({
  definitions,
  loading = false,
  error = null,
  selectedKeys,
  onToggle,
  notes,
  onNotesChange,
  disabledKeys = [],
  disableNotes = false,
  idPrefix,
}: SiteReportAddonSelectorProps) {
  const availableDefinitions = definitions.filter(
    (definition) => !disabledKeys.includes(definition.key)
  );

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
      <div className="mb-4">
        <p className="mb-1 text-sm font-medium">Add-on Services</p>
        <p className="text-sm text-muted-foreground">
          Optionally request paid site reports for this land. Pricing will be
          provided after your request, and our team will follow up with a quote.
        </p>
      </div>

      {loading ? (
        <p className="rounded-xl border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
          Loading add-on services…
        </p>
      ) : error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </p>
      ) : availableDefinitions.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {availableDefinitions.map((report) => {
            const selected = selectedKeys.includes(report.key);

            return (
              <div
                key={report.key}
                className={cn(
                  "flex flex-col justify-between rounded-xl border bg-background/80 p-4 transition",
                  selected
                    ? "border-primary shadow-sm"
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={selected ? "default" : "outline"}
                  size="sm"
                  className="mt-4 w-fit"
                  onClick={() => onToggle(report.key)}
                  aria-pressed={selected}
                >
                  {selected ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Selected
                    </>
                  ) : (
                    "Request"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
          All available site reports have already been requested for this land.
        </p>
      )}

      <div className="mt-4 space-y-2">
        <Label htmlFor={`${idPrefix}-site-report-notes`}>
          Notes for site reports (optional)
        </Label>
        <textarea
          id={`${idPrefix}-site-report-notes`}
          rows={3}
          value={notes}
          disabled={disableNotes || selectedKeys.length === 0}
          maxLength={1000}
          placeholder="Tell us about access constraints, preferred timing, or other details for the reports."
          onChange={(e) => onNotesChange(e.target.value)}
          className={cn(
            "flex w-full resize-none rounded-xl border-0 bg-background/80 px-3 py-2.5 text-sm",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        <p className="text-xs text-muted-foreground">
          Select at least one report to include notes with your request.
        </p>
      </div>
    </div>
  );
}
