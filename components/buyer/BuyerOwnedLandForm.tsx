"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BuyerRequirementSets } from "@/components/buyer/BuyerRequirementSets";
import { LandBoundarySides } from "@/components/buyer/LandBoundarySides";
import { SiteDocumentChecklist } from "@/components/buyer/SiteDocumentChecklist";
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
  defaultBoundaryInputs,
  defaultBuildRequirements,
  measurementsFromSides,
  parseBoundarySides,
  purposeSaveBlocked,
  splitRequirementSets,
  type BoundarySideInput,
  type BuyerBuildRequirements,
  type LandPurpose,
  type SiteDocumentKey,
} from "@/lib/buyer-requirements";
import { clearBuyerStart, readBuyerStart, readLandDraft } from "@/lib/buyer-start";
import { uploadSiteDocuments } from "@/lib/site-documents-upload";

type BuyerOwnedLandFormProps = {
  onSuccess?: () => void;
};

export function BuyerOwnedLandForm({ onSuccess }: BuyerOwnedLandFormProps) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [landSize, setLandSize] = useState("");
  const [boundarySides, setBoundarySides] = useState<BoundarySideInput[]>(defaultBoundaryInputs());
  const [siteDocuments, setSiteDocuments] = useState<SiteDocumentKey[]>([]);
  const [siteFiles, setSiteFiles] = useState<Partial<Record<SiteDocumentKey, File>>>({});
  const [landValue, setLandValue] = useState("");
  const [purpose, setPurpose] = useState<LandPurpose | "">("");
  const [requirementSets, setRequirementSets] = useState<BuyerBuildRequirements[]>([
    defaultBuildRequirements(),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const start = readBuyerStart();
      const draft = readLandDraft();
      if (draft?.address) {
        setAddress(draft.address);
        setLandSize(draft.landSize);
        if (draft.boundarySides?.length) {
          setBoundarySides(draft.boundarySides);
        } else if (draft.frontage || draft.depth) {
          const sides = defaultBoundaryInputs();
          sides[0] = { ...sides[0], length: draft.frontage };
          sides[2] = { ...sides[2], length: draft.depth };
          setBoundarySides(sides);
        }
        if (draft.siteDocuments?.length) setSiteDocuments(draft.siteDocuments);
        setLandValue(draft.landValue);
        setPurpose(draft.purpose);
        if (draft.requirementSets?.length) {
          setRequirementSets(draft.requirementSets);
        }
      } else if (start?.plotAddress) {
        setAddress(start.plotAddress);
      }
    });
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const size = Number(landSize);
    const value = landValue ? Number(landValue) : undefined;
    const parsedSides = parseBoundarySides(boundarySides);
    if ("error" in parsedSides) {
      setError(parsedSides.error);
      setLoading(false);
      return;
    }
    const measurements = measurementsFromSides(parsedSides.sides);

    const buildRequirements = composeBuildRequirements(purpose, requirementSets, {
      boundary_sides: parsedSides.sides,
      site_documents: siteDocuments.map((key) => ({ key })),
    });
    buildRequirements.land_size_sqm = size;
    buildRequirements.frontage_meters = measurements.frontage_meters;
    buildRequirements.left_side_meters = measurements.left_side_meters;
    buildRequirements.depth_meters = measurements.depth_meters;
    buildRequirements.right_side_meters = measurements.right_side_meters;

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
        frontage_meters: measurements.frontage_meters,
        land_value: value,
        build_requirements: buildRequirements,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Failed to register your land.");
      setLoading(false);
      return;
    }

    const listingId = String(data.id);
    const uploadError = await uploadSiteDocuments(listingId, siteFiles);

    clearBuyerStart();
    onSuccess?.();
    const docs = uploadError ? "&docs=1" : "";
    router.push(`/buyer/milestones?listing=${encodeURIComponent(listingId)}${docs}`);
    router.refresh();
  }

  return (
    <Card className="lg:max-w-3xl">
      <CardHeader>
        <CardTitle>Land and build brief</CardTitle>
        <CardDescription>
          Capture the site facts builders need before they price your real block.
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

            <div className="space-y-2 sm:col-span-2">
              <LandBoundarySides
                sides={boundarySides}
                onChange={setBoundarySides}
                idPrefix="owned-sides"
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
              onPurposeChange={(next) => {
                setPurpose(next);
                if (next === "knockdown_rebuild") {
                  setRequirementSets((sets) =>
                    sets.map((set, index) =>
                      index === 0 && (!set.house_type || set.house_type === "not_sure")
                        ? { ...set, house_type: "knockdown_rebuild" }
                        : set
                    )
                  );
                }
              }}
              sets={requirementSets}
              onSetsChange={setRequirementSets}
              idPrefix="owned-land"
              hideLandMeasurements
              hideBuilderTypes
            />
          </div>

          <SiteDocumentChecklist
            idPrefix="owned-docs"
            selected={siteDocuments}
            files={siteFiles}
            onToggle={(key) => {
              setSiteDocuments((current) =>
                current.includes(key)
                  ? current.filter((item) => item !== key)
                  : [...current, key]
              );
              if (siteDocuments.includes(key)) {
                setSiteFiles((current) => {
                  const next = { ...current };
                  delete next[key];
                  return next;
                });
              }
            }}
            onFile={(key, file) =>
              setSiteFiles((current) => {
                const next = { ...current };
                if (file) next[key] = file;
                else delete next[key];
                return next;
              })
            }
          />

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
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
