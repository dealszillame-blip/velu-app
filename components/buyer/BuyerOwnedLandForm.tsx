"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BuyerRequirementSets } from "@/components/buyer/BuyerRequirementSets";
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
  briefSaveBlocked,
  composeBuildRequirements,
  defaultBuildRequirements,
  purposeSaveBlocked,
  splitRequirementSets,
  type BuyerBuildRequirements,
  type LandPurpose,
} from "@/lib/buyer-requirements";
import { clearBuyerStart, readBuyerStart, readLandDraft } from "@/lib/buyer-start";
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
  const [depth, setDepth] = useState("");
  const [landValue, setLandValue] = useState("");
  const [purpose, setPurpose] = useState<LandPurpose | "">("");
  const [requirementSets, setRequirementSets] = useState<BuyerBuildRequirements[]>([
    defaultBuildRequirements(),
  ]);
  const [saved, setSaved] = useState(false);
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
    const start = readBuyerStart();
    const draft = readLandDraft();
    if (draft?.address) {
      setAddress(draft.address);
      setLandSize(draft.landSize);
      setFrontage(draft.frontage);
      setDepth(draft.depth);
      setLandValue(draft.landValue);
      setPurpose(draft.purpose);
      if (draft.requirementSets?.length) {
        setRequirementSets(draft.requirementSets);
      }
    } else if (start?.plotAddress) {
      setAddress(start.plotAddress);
    }
  }, []);

  useEffect(() => {
    fetch("/api/buyer/requirements")
      .then((res) => res.json())
      .then((data) => {
        if (readLandDraft()) return;
        if (data.build_requirements) {
          setPurpose(data.build_requirements.purpose ?? "");
          setRequirementSets(splitRequirementSets(data.build_requirements));
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

    const size = Number(landSize);
    const front = Number(frontage);
    const depthMeters = depth ? Number(depth) : undefined;
    const value = landValue ? Number(landValue) : undefined;

    const buildRequirements = composeBuildRequirements(purpose, requirementSets);
    buildRequirements.land_size_sqm = size;
    buildRequirements.frontage_meters = front;
    if (depthMeters != null) {
      buildRequirements.depth_meters = depthMeters;
    }

    const purposeBlocked = purposeSaveBlocked(buildRequirements);
    if (purposeBlocked) {
      setError(purposeBlocked);
      setLoading(false);
      return;
    }

    const blocked = briefSaveBlocked(buildRequirements);
    if (blocked) {
      setError(`${blocked} Resolve or confirm the mismatch before saving.`);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/buyer/land", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        land_size_sqm: size,
        frontage_meters: front,
        land_value: value,
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
    setDepth("");
    setLandValue("");
    setSelectedSiteReportKeys([]);
    setSiteReportNotes("");
    setSaved(true);
    setLoading(false);
    clearBuyerStart();
    onSuccess?.();
    router.refresh();
  }

  return (
    <Card className="lg:max-w-3xl">
      <CardHeader>
        <CardTitle>Land details</CardTitle>
        <CardDescription>
          Address, size, and what you want built on this block.
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
              <Label htmlFor="owned-depth">Depth (m)</Label>
              <Input
                id="owned-depth"
                type="number"
                min={1}
                step="0.01"
                placeholder="30"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
              />
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
            <BuyerRequirementSets
              purpose={purpose}
              onPurposeChange={setPurpose}
              sets={requirementSets}
              onSetsChange={setRequirementSets}
              idPrefix="owned-land"
              hideLandMeasurements
              hideBuilderTypes
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
          {saved && (
            <p className="text-sm text-primary" role="status">
              Land registered. You can add another block on this page.
            </p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Registering…" : "Register your land"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
