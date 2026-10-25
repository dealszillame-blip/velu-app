"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_BOUNDARY_SIDES,
  MIN_BOUNDARY_SIDES,
  resizeBoundaryInputs,
  type BoundarySideInput,
} from "@/lib/buyer-requirements";

type LandBoundarySidesProps = {
  sides: BoundarySideInput[];
  onChange: (sides: BoundarySideInput[]) => void;
  idPrefix?: string;
};

export function LandBoundarySides({
  sides,
  onChange,
  idPrefix = "sides",
}: LandBoundarySidesProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div className="space-y-2 sm:max-w-xs">
        <Label htmlFor={`${idPrefix}-count`}>Number of sides</Label>
        <p className="text-sm text-muted-foreground">
          Start with 4 sides. Add more when the block is not a simple rectangle.
        </p>
        <select
          id={`${idPrefix}-count`}
          className="h-11 w-full rounded-xl border border-border bg-card px-4 text-sm"
          value={sides.length}
          onChange={(event) => onChange(resizeBoundaryInputs(sides, Number(event.target.value)))}
        >
          {Array.from(
            { length: MAX_BOUNDARY_SIDES - MIN_BOUNDARY_SIDES + 1 },
            (_, index) => MIN_BOUNDARY_SIDES + index
          ).map((count) => (
            <option key={count} value={count}>
              {count} sides
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sides.map((side, index) => (
          <div key={`${idPrefix}-${index}`} className="space-y-2">
            <Label htmlFor={`${idPrefix}-length-${index}`}>
              {side.label || `Side ${index + 1}`} length (m)
            </Label>
            <Input
              id={`${idPrefix}-length-${index}`}
              type="number"
              min={0.1}
              step="0.01"
              required
              placeholder="15.5"
              value={side.length}
              onChange={(event) =>
                onChange(
                  sides.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, length: event.target.value } : item
                  )
                )
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
