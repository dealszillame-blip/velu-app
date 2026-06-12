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
import { SegmentControl } from "@/components/shared/SegmentControl";
import { statusLabel, type MapFilters } from "@/lib/listings";
import { SW_SYDNEY_SUBURBS } from "@/lib/map/config";
import type { ListingStatus } from "@/lib/types";

const STATUS_OPTIONS: ListingStatus[] = [
  "available",
  "under_offer",
  "sold",
];

type MapFiltersProps = {
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
  resultCount: number;
  onClear?: () => void;
};

export function MapFiltersPanel({
  filters,
  onChange,
  resultCount,
  onClear,
}: MapFiltersProps) {
  const status = filters.status ?? "available";
  const hasFilters = Boolean(
    filters.suburb ||
      filters.priceMin != null ||
      filters.priceMax != null ||
      filters.sizeMin != null ||
      filters.sizeMax != null
  );

  return (
    <div className="surface-subtle space-y-5 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="label-caps">Filters</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {resultCount}
            <span className="ml-1.5 text-base font-normal text-muted-foreground">
              listing{resultCount === 1 ? "" : "s"}
            </span>
          </p>
        </div>
        {hasFilters && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-2">
        <Label className="label-caps">Status</Label>
        <SegmentControl
          options={STATUS_OPTIONS.map((option) => ({
            value: option,
            label: statusLabel(option),
          }))}
          value={status}
          onChange={(value) =>
            onChange({ ...filters, status: value as ListingStatus })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="suburb" className="label-caps">
          Suburb
        </Label>
        <Select
          value={filters.suburb ?? "all"}
          onValueChange={(v) =>
            onChange({
              ...filters,
              suburb: !v || v === "all" ? undefined : v,
            })
          }
        >
          <SelectTrigger id="suburb" className="h-11 w-full rounded-xl">
            <SelectValue placeholder="All suburbs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All suburbs</SelectItem>
            {SW_SYDNEY_SUBURBS.map((suburb) => (
              <SelectItem key={suburb} value={suburb}>
                {suburb}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="priceMin" className="label-caps">
            Min price
          </Label>
          <Input
            id="priceMin"
            type="number"
            placeholder="400k"
            value={filters.priceMin ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                priceMin: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceMax" className="label-caps">
            Max price
          </Label>
          <Input
            id="priceMax"
            type="number"
            placeholder="900k"
            value={filters.priceMax ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                priceMax: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="sizeMin" className="label-caps">
            Min m²
          </Label>
          <Input
            id="sizeMin"
            type="number"
            placeholder="350"
            value={filters.sizeMin ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                sizeMin: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sizeMax" className="label-caps">
            Max m²
          </Label>
          <Input
            id="sizeMax"
            type="number"
            placeholder="700"
            value={filters.sizeMax ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                sizeMax: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="label-caps mb-2">Map legend</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#5aa84a]" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#dba94e]" />
            Under contract
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e05b3a]" />
            Sold
          </span>
        </div>
      </div>
    </div>
  );
}
