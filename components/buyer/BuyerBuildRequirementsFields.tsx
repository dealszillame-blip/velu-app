"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BuyerBuildRequirements } from "@/lib/buyer-requirements";
import {
  GRANNY_FLAT_OPTIONS,
  STOREY_OPTIONS,
} from "@/lib/buyer-requirements";

type BuyerBuildRequirementsFieldsProps = {
  value: BuyerBuildRequirements;
  onChange: (value: BuyerBuildRequirements) => void;
  idPrefix?: string;
};

export function BuyerBuildRequirementsFields({
  value,
  onChange,
  idPrefix = "req",
}: BuyerBuildRequirementsFieldsProps) {
  function patch(partial: Partial<BuyerBuildRequirements>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tell builders what you&apos;re looking for so proposals match your plans.
      </p>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-storeys`}>Storeys</Label>
        <Select
          value={value.storeys}
          onValueChange={(v) =>
            v && patch({ storeys: v as BuyerBuildRequirements["storeys"] })
          }
        >
          <SelectTrigger id={`${idPrefix}-storeys`} className="w-full">
            <SelectValue placeholder="Select storeys" />
          </SelectTrigger>
          <SelectContent>
            {STOREY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-granny`}>Granny flat</Label>
        <Select
          value={value.granny_flat}
          onValueChange={(v) =>
            v && patch({ granny_flat: v as BuyerBuildRequirements["granny_flat"] })
          }
        >
          <SelectTrigger id={`${idPrefix}-granny`} className="w-full">
            <SelectValue placeholder="Granny flat preference" />
          </SelectTrigger>
          <SelectContent>
            {GRANNY_FLAT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-bedrooms`}>Bedrooms</Label>
          <Input
            id={`${idPrefix}-bedrooms`}
            type="number"
            min={1}
            max={12}
            required
            value={value.bedrooms}
            onChange={(e) => patch({ bedrooms: Number(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-bathrooms`}>Bathrooms</Label>
          <Input
            id={`${idPrefix}-bathrooms`}
            type="number"
            min={1}
            max={12}
            step={0.5}
            required
            value={value.bathrooms}
            onChange={(e) =>
              patch({ bathrooms: Number(e.target.value) || 1 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-car`}>Car spaces</Label>
          <Input
            id={`${idPrefix}-car`}
            type="number"
            min={0}
            max={10}
            value={value.car_spaces ?? 0}
            onChange={(e) =>
              patch({ car_spaces: Number(e.target.value) || 0 })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-notes`}>Anything else? (optional)</Label>
        <textarea
          id={`${idPrefix}-notes`}
          rows={3}
          placeholder="e.g. open-plan living, study, alfresco, single-level living area…"
          value={value.additional_notes ?? ""}
          onChange={(e) => patch({ additional_notes: e.target.value })}
          className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}
