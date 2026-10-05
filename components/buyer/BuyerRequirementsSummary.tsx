import {
  Bath,
  BedDouble,
  Calendar,
  Car,
  Home,
  Layers,
  Ruler,
  Sofa,
} from "lucide-react";
import type { BuyerBuildRequirements } from "@/lib/buyer-requirements";
import {
  constructionGradeLabel,
  ensuiteLabel,
  formatBuildRequirementsSummary,
  formatSettlementDate,
  grannyFlatLabel,
  houseTypeLabel,
  storeyBriefContradiction,
  storeyLabel,
} from "@/lib/buyer-requirements";
import { builderTypeLabel } from "@/lib/builder-types";

type LandMeasurements = {
  land_size_sqm?: number | null;
  frontage_meters?: number | null;
  depth_meters?: number | null;
  left_side_meters?: number | null;
  right_side_meters?: number | null;
};

type BuyerRequirementsSummaryProps = {
  requirements: BuyerBuildRequirements;
  compact?: boolean;
  land?: LandMeasurements;
};

export function BuyerRequirementsSummary({
  requirements,
  compact = false,
  land,
}: BuyerRequirementsSummaryProps) {
  if (compact) {
    return (
      <p className="text-sm text-muted-foreground">
        {formatBuildRequirementsSummary(requirements)}
      </p>
    );
  }

  const settlement = formatSettlementDate(requirements.settlement_date);
  const size = land?.land_size_sqm ?? requirements.land_size_sqm;
  const frontage = land?.frontage_meters ?? requirements.frontage_meters;
  const depth = land?.depth_meters ?? requirements.depth_meters;
  const left = land?.left_side_meters ?? requirements.left_side_meters;
  const right = land?.right_side_meters ?? requirements.right_side_meters;
  const measurements = [
    size != null && `${size} m²`,
    frontage != null && `${frontage} m frontage`,
    depth != null && `${depth} m depth`,
    left != null && `${left} m left`,
    right != null && `${right} m right`,
  ].filter(Boolean);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="surface-subtle flex items-start gap-3 p-4">
        <Home className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="label-caps mb-1">House type</p>
          <p className="text-sm font-medium">
            {houseTypeLabel(requirements.house_type)}
          </p>
        </div>
      </div>
      <div className="surface-subtle flex items-start gap-3 p-4">
        <Layers className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="label-caps mb-1">Storeys</p>
          <p className="text-sm font-medium">{storeyLabel(requirements.storeys)}</p>
          {storeyBriefContradiction(requirements) ? (
            <p className="mt-1 text-xs text-amber-800">
              {storeyBriefContradiction(requirements)}
            </p>
          ) : null}
        </div>
      </div>
      <div className="surface-subtle flex items-start gap-3 p-4">
        <Home className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="label-caps mb-1">Granny flat</p>
          <p className="text-sm font-medium">
            {grannyFlatLabel(requirements.granny_flat)}
          </p>
        </div>
      </div>
      {settlement ? (
        <div className="surface-subtle flex items-start gap-3 p-4">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="label-caps mb-1">Settlement</p>
            <p className="text-sm font-medium">{settlement}</p>
          </div>
        </div>
      ) : null}
      {requirements.construction_grade ? (
        <div className="surface-subtle flex items-start gap-3 p-4">
          <Home className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="label-caps mb-1">Construction type</p>
            <p className="text-sm font-medium">
              {constructionGradeLabel(requirements.construction_grade)}
            </p>
          </div>
        </div>
      ) : null}
      {requirements.preferred_builder_types?.length ? (
        <div className="surface-subtle flex items-start gap-3 p-4">
          <Home className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="label-caps mb-1">Builder types</p>
            <p className="text-sm font-medium">
              {requirements.preferred_builder_types
                .map((type) => builderTypeLabel(type))
                .join(" · ")}
            </p>
          </div>
        </div>
      ) : null}
      <div className="surface-subtle flex items-start gap-3 p-4">
        <BedDouble className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="label-caps mb-1">Bedrooms</p>
          <p className="text-sm font-medium">{requirements.bedrooms}</p>
        </div>
      </div>
      <div className="surface-subtle flex items-start gap-3 p-4">
        <Bath className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="label-caps mb-1">Bathrooms</p>
          <p className="text-sm font-medium">{requirements.bathrooms}</p>
        </div>
      </div>
      <div className="surface-subtle flex items-start gap-3 p-4">
        <Sofa className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="label-caps mb-1">Living rooms</p>
          <p className="text-sm font-medium">{requirements.living_rooms ?? "—"}</p>
        </div>
      </div>
      {(requirements.car_spaces ?? 0) > 0 && (
        <div className="surface-subtle flex items-start gap-3 p-4">
          <Car className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="label-caps mb-1">Car spaces</p>
            <p className="text-sm font-medium">{requirements.car_spaces}</p>
          </div>
        </div>
      )}
      <div className="surface-subtle flex items-start gap-3 p-4">
        <Bath className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="label-caps mb-1">Ensuite</p>
          <p className="text-sm font-medium">{ensuiteLabel(requirements.ensuite)}</p>
        </div>
      </div>
      {measurements.length > 0 ? (
        <div className="surface-subtle flex items-start gap-3 p-4 sm:col-span-2">
          <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="label-caps mb-1">Land measurements</p>
            <p className="text-sm font-medium">{measurements.join(" · ")}</p>
            {requirements.floor_area_sqm != null ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Target floor area {requirements.floor_area_sqm} m²
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      {requirements.additional_notes?.trim() && (
        <div className="surface-subtle p-4 sm:col-span-2 lg:col-span-3">
          <p className="label-caps mb-1">Additional notes</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {requirements.additional_notes}
          </p>
        </div>
      )}
    </div>
  );
}
