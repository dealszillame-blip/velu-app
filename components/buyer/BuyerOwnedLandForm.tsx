"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BuyerBuildRequirementsFields } from "@/components/buyer/BuyerBuildRequirementsFields";
import { SiteReportAddonSelector } from "@/components/buyer/SiteReportAddonSelector";
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
import {
  DEFAULT_SITE_REPORT_DEFINITIONS,
  type SiteReportDefinition,
} from "@/lib/site-reports";

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
  >(DEFAULT_SITE_REPORT_DEFINITIONS);
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

        return Array.isArray(data) && data.length > 0
          ? data
          : DEFAULT_SITE_REPORT_DEFINITIONS;
      })
      .then((data) => {
        if (!isMounted) return;
        setSiteReportDefinitions(data);
        setSiteReportsError(null);
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        setSiteReportDefinitions(DEFAULT_SITE_REPORT_DEFINITIONS);
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

          <SiteReportAddonSelector
            idPrefix="owned-land"
            definitions={siteReportDefinitions}
            loading={siteReportsLoading}
            error={siteReportsError}
            selectedKeys={selectedSiteReportKeys}
            onToggle={toggleSiteReport}
            notes={siteReportNotes}
            onNotesChange={setSiteReportNotes}
          />

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
