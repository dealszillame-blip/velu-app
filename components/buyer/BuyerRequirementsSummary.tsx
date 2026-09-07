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
  ensuiteLabel,
  formatBuildRequirementsSummary,
  formatSettlementDate,
  grannyFlatLabel,
  houseTypeLabel,
  storeyLabel,
} from "@/lib/buyer-requirements";

type BuyerRequirementsSummaryProps = {
  requirements: BuyerBuildRequirements;
  compact?: boolean;
};

export function BuyerRequirementsSummary({
  requirements,
  compact = false,
}: BuyerRequirementsSummaryProps) {
  if (compact) {
    return (
      <p className="text-sm text-muted-foreground">
        {formatBuildRequirementsSummary(requirements)}
      </p>
    );
  }

  const settlement = formatSettlementDate(requirements.settlement_date);
  const measurements = [
    requirements.land_size_sqm != null && `${requirements.land_size_sqm} m²`,
    requirements.frontage_meters != null &&
      `${requirements.frontage_meters} m frontage`,
    requirements.depth_meters != null && `${requirements.depth_meters} m depth`,
    requirements.left_side_meters != null &&
      `${requirements.left_side_meters} m left`,
    requirements.right_side_meters != null &&
      `${requirements.right_side_meters} m right`,
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
