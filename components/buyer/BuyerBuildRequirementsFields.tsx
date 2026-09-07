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
  ENSUITE_OPTIONS,
  GRANNY_FLAT_OPTIONS,
  HOUSE_TYPE_OPTIONS,
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

  function patchNumber(
    key:
      | "bedrooms"
      | "bathrooms"
      | "car_spaces"
      | "living_rooms"
      | "land_size_sqm"
      | "frontage_meters"
      | "depth_meters"
      | "left_side_meters"
      | "right_side_meters"
      | "floor_area_sqm",
    raw: string
  ) {
    const next = raw === "" ? undefined : Number(raw);
    patch({ [key]: Number.isFinite(next) ? next : undefined } as Partial<BuyerBuildRequirements>);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Tell builders the land, settlement, and house you want so quotes match
        the brief.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-house-type`}>House type</Label>
          <Select
            value={value.house_type ?? "not_sure"}
            onValueChange={(v) =>
              v &&
              patch({
                house_type: v as BuyerBuildRequirements["house_type"],
              })
            }
          >
            <SelectTrigger id={`${idPrefix}-house-type`} className="w-full">
              <SelectValue placeholder="Select house type" />
            </SelectTrigger>
            <SelectContent>
              {HOUSE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              v &&
              patch({ granny_flat: v as BuyerBuildRequirements["granny_flat"] })
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

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-settlement`}>Settlement date</Label>
          <Input
            id={`${idPrefix}-settlement`}
            type="date"
            value={value.settlement_date ?? ""}
            onChange={(e) => patch({ settlement_date: e.target.value })}
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Land measurements</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-land-size`}>Land size (m²)</Label>
            <Input
              id={`${idPrefix}-land-size`}
              type="number"
              min={1}
              step="0.01"
              placeholder="450"
              value={value.land_size_sqm ?? ""}
              onChange={(e) => patchNumber("land_size_sqm", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-frontage`}>Frontage (m)</Label>
            <Input
              id={`${idPrefix}-frontage`}
              type="number"
              min={1}
              step="0.01"
              placeholder="15.5"
              value={value.frontage_meters ?? ""}
              onChange={(e) => patchNumber("frontage_meters", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-depth`}>Depth (m)</Label>
            <Input
              id={`${idPrefix}-depth`}
              type="number"
              min={1}
              step="0.01"
              placeholder="30"
              value={value.depth_meters ?? ""}
              onChange={(e) => patchNumber("depth_meters", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-left-side`}>Left side (m)</Label>
            <Input
              id={`${idPrefix}-left-side`}
              type="number"
              min={1}
              step="0.01"
              placeholder="30"
              value={value.left_side_meters ?? ""}
              onChange={(e) => patchNumber("left_side_meters", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-right-side`}>Right side (m)</Label>
            <Input
              id={`${idPrefix}-right-side`}
              type="number"
              min={1}
              step="0.01"
              placeholder="30"
              value={value.right_side_meters ?? ""}
              onChange={(e) => patchNumber("right_side_meters", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-floor-area`}>Floor area (m²)</Label>
            <Input
              id={`${idPrefix}-floor-area`}
              type="number"
              min={1}
              step="0.01"
              placeholder="220"
              value={value.floor_area_sqm ?? ""}
              onChange={(e) => patchNumber("floor_area_sqm", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Rooms</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <Label htmlFor={`${idPrefix}-living`}>Living rooms</Label>
            <Input
              id={`${idPrefix}-living`}
              type="number"
              min={1}
              max={8}
              value={value.living_rooms ?? 2}
              onChange={(e) =>
                patch({ living_rooms: Number(e.target.value) || 1 })
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
        <div className="mt-4 space-y-2">
          <Label htmlFor={`${idPrefix}-ensuite`}>Ensuite</Label>
          <Select
            value={value.ensuite ?? "not_sure"}
            onValueChange={(v) =>
              v && patch({ ensuite: v as BuyerBuildRequirements["ensuite"] })
            }
          >
            <SelectTrigger id={`${idPrefix}-ensuite`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENSUITE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
