import {
  Bath,
  BedDouble,
  Car,
  Home,
  Layers,
} from "lucide-react";
import type { BuyerBuildRequirements } from "@/lib/buyer-requirements";
import {
  formatBuildRequirementsSummary,
  grannyFlatLabel,
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

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      {(requirements.car_spaces ?? 0) > 0 && (
        <div className="surface-subtle flex items-start gap-3 p-4">
          <Car className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="label-caps mb-1">Car spaces</p>
            <p className="text-sm font-medium">{requirements.car_spaces}</p>
          </div>
        </div>
      )}
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
