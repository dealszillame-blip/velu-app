"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText } from "lucide-react";
import { BuyerBuildRequirementsFields } from "@/components/buyer/BuyerBuildRequirementsFields";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultBuildRequirements,
  type BuyerBuildRequirements,
} from "@/lib/buyer-requirements";
import { ZONING_OPTIONS } from "@/lib/map/config";
import type { SiteReportDefinition } from "@/lib/site-reports";
import { cn } from "@/lib/utils";

type BuyerOwnedLandFormProps = {
  onSuccess?: () => void;
};

export function BuyerOwnedLandForm({ onSuccess }: BuyerOwnedLandFormProps) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [landSize, setLandSize] = useState("");
  const [frontage, setFrontage] = useState("");
  const [zoning, setZoning] = useState("R2");
  const [landValue, setLandValue] = useState("");
  const [buildRequirements, setBuildRequirements] =
    useState<BuyerBuildRequirements>(defaultBuildRequirements());
  const [siteReportDefinitions, setSiteReportDefinitions] = useState<
    SiteReportDefinition[]
  >([]);
  const [siteReportsLoading, setSiteReportsLoading] = useState(true);
  const [siteReportsError, setSiteReportsError] = useState<string | null>(null);
  const [selectedSiteReportKeys, setSelectedSiteReportKeys] = useState<
    string[]
  >([]);
  const [siteReportNotes, setSiteReportNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/buyer/requirements")
      .then((res) => res.json())
      .then((data) => {
        if (data.build_requirements) {
          setBuildRequirements(data.build_requirements);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/buyer/site-reports")
      .then(async (res) => {
        const data = await res.json().catch(() => []);

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load add-on services.");
        }

        return Array.isArray(data) ? data : [];
      })
      .then((data) => {
        if (!isMounted) return;
        setSiteReportDefinitions(data);
        setSiteReportsError(null);
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        setSiteReportsError(err.message);
      })
      .finally(() => {
        if (!isMounted) return;
        setSiteReportsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function toggleSiteReport(reportKey: string) {
    setSelectedSiteReportKeys((current) =>
      current.includes(reportKey)
        ? current.filter((key) => key !== reportKey)
        : [...current, reportKey]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/buyer/land", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        land_size_sqm: Number(landSize),
        frontage_meters: Number(frontage),
        zoning,
        land_value: landValue ? Number(landValue) : undefined,
        build_requirements: buildRequirements,
        site_report_keys: selectedSiteReportKeys,
        site_report_notes:
          selectedSiteReportKeys.length > 0
            ? siteReportNotes.trim() || undefined
            : undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Failed to register your land.");
      setLoading(false);
      return;
    }

    setAddress("");
    setLandSize("");
    setFrontage("");
    setLandValue("");
    setSelectedSiteReportKeys([]);
    setSiteReportNotes("");
    setLoading(false);
    onSuccess?.();
    router.push("/buyer/compare");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register your block</CardTitle>
        <CardDescription>
          Tell us about the land you already own and what you want to build.
          We geocode your address and notify matched builders in your area.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="owned-address">Street address</Label>
              <Input
                id="owned-address"
                required
                placeholder="7 Wattle Grove, Leumeah NSW 2560"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owned-landSize">Land size (m²)</Label>
              <Input
                id="owned-landSize"
                type="number"
                min={1}
                step="0.01"
                required
                placeholder="450"
                value={landSize}
                onChange={(e) => setLandSize(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owned-frontage">Frontage (m)</Label>
              <Input
                id="owned-frontage"
                type="number"
                min={1}
                step="0.01"
                required
                placeholder="15.5"
                value={frontage}
                onChange={(e) => setFrontage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owned-zoning">Zoning</Label>
              <Select value={zoning} onValueChange={(v) => v && setZoning(v)}>
                <SelectTrigger id="owned-zoning" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZONING_OPTIONS.map((z) => (
                    <SelectItem key={z} value={z}>
                      {z}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owned-landValue">
                Estimated land value (optional)
              </Label>
              <Input
                id="owned-landValue"
                type="number"
                min={0}
                placeholder="650000"
                value={landValue}
                onChange={(e) => setLandValue(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
            <p className="mb-1 text-sm font-medium">Your build requirements</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Help builders understand what you want to build on this block.
            </p>
            <BuyerBuildRequirementsFields
              value={buildRequirements}
              onChange={setBuildRequirements}
              idPrefix="owned-land"
            />
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
            <div className="mb-4">
              <p className="mb-1 text-sm font-medium">Add-on Services</p>
              <p className="text-sm text-muted-foreground">
                Optionally request paid site reports for this land. Pricing will
                be provided after your request, and our team will follow up with
                a quote.
              </p>
            </div>

            {siteReportsLoading ? (
              <p className="rounded-xl border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
                Loading add-on services…
              </p>
            ) : siteReportsError ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {siteReportsError}
              </p>
            ) : siteReportDefinitions.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {siteReportDefinitions.map((report) => {
                  const selected = selectedSiteReportKeys.includes(report.key);

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
                        onClick={() => toggleSiteReport(report.key)}
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
                No add-on services are available right now.
              </p>
            )}

            <div className="mt-4 space-y-2">
              <Label htmlFor="site-report-notes">
                Notes for site reports (optional)
              </Label>
              <textarea
                id="site-report-notes"
                rows={3}
                value={siteReportNotes}
                disabled={selectedSiteReportKeys.length === 0}
                maxLength={1000}
                placeholder="Tell us about access constraints, preferred timing, or other details for the reports."
                onChange={(e) => setSiteReportNotes(e.target.value)}
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

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Registering…" : "Find builders for my land"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
