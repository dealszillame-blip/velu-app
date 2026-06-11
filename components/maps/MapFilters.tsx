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
    <div className="space-y-4 rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-medium">Filters</h2>
          <p className="text-sm text-muted-foreground">
            {resultCount} listing{resultCount === 1 ? "" : "s"} shown
          </p>
        </div>
        {hasFilters && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Listing status</Label>
        <Select
          value={status}
          onValueChange={(value) =>
            onChange({
              ...filters,
              status: value as ListingStatus,
            })
          }
        >
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {statusLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="suburb">Suburb</Label>
        <Select
          value={filters.suburb ?? "all"}
          onValueChange={(v) =>
            onChange({
              ...filters,
              suburb: !v || v === "all" ? undefined : v,
            })
          }
        >
          <SelectTrigger id="suburb" className="w-full">
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
          <Label htmlFor="priceMin">Min price</Label>
          <Input
            id="priceMin"
            type="number"
            placeholder="400000"
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
          <Label htmlFor="priceMax">Max price</Label>
          <Input
            id="priceMax"
            type="number"
            placeholder="900000"
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
          <Label htmlFor="sizeMin">Min size (m²)</Label>
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
          <Label htmlFor="sizeMax">Max size (m²)</Label>
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
    </div>
  );
}
