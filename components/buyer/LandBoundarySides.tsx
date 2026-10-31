"use client";

import { useEffect, useState } from "react";
import { LandSketch } from "@/components/buyer/LandSketch";
import { Button } from "@/components/ui/button";
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

function sideTitle(side: BoundarySideInput, index: number) {
  return `${index + 1} · ${side.label || `Side ${index + 1}`}`;
}

export function LandBoundarySides({
  sides,
  onChange,
  idPrefix = "sides",
}: LandBoundarySidesProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const lengths = sides.map((side) => {
    const value = Number(side.length);
    return side.length.trim() && Number.isFinite(value) && value > 0 ? value : null;
  });
  const entered = sides.filter((side) => side.length.trim()).length;

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.getElementById(`${idPrefix}-length-0`)?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, idPrefix]);

  function selectSide(index: number) {
    setActiveIndex(index);
    document.getElementById(`${idPrefix}-length-${index}`)?.focus();
  }

  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Land sketch</p>
        <p className="text-sm text-muted-foreground">
          Open the sketch and enter each side in order, starting at the front. Your builder
          sees the same sketch and that sequence.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          Open land sketch
        </Button>
        <p className="text-sm text-muted-foreground">
          {sides.length} sides
          {entered > 0 ? ` · ${entered} entered` : " · lengths not entered yet"}
        </p>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6"
          onMouseDown={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${idPrefix}-sketch-title`}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-md border border-border bg-card p-5 shadow-[6px_6px_0_var(--surface-subtle)] sm:p-6"
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 id={`${idPrefix}-sketch-title`} className="text-lg font-semibold tracking-tight">
                  Sketch your block
                </h2>
                <p className="text-sm text-muted-foreground">
                  Start at side 1 (the front) and continue around the block in order. Side 2 is
                  the left boundary, then the rear, then the right. The builder receives these
                  lengths in that sequence.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-2 sm:max-w-xs">
              <Label htmlFor={`${idPrefix}-count`}>Number of sides</Label>
              <select
                id={`${idPrefix}-count`}
                className="h-11 w-full rounded-xl border border-border bg-card px-4 text-sm"
                value={sides.length}
                onChange={(event) => {
                  const next = resizeBoundaryInputs(sides, Number(event.target.value));
                  onChange(next);
                  setActiveIndex((current) => Math.min(current, next.length - 1));
                }}
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

            <div className="mt-5 grid items-start gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
              <LandSketch
                labels={sides.map((side) => side.label)}
                lengths={lengths}
                activeIndex={activeIndex}
                onSelect={selectSide}
              />
              <div className="grid gap-3">
                {sides.map((side, index) => (
                  <div key={`${idPrefix}-${index}`} className="space-y-1.5">
                    <Label htmlFor={`${idPrefix}-length-${index}`}>{sideTitle(side, index)} (m)</Label>
                    <Input
                      id={`${idPrefix}-length-${index}`}
                      type="number"
                      min={0.1}
                      step="0.01"
                      inputMode="decimal"
                      placeholder="15.5"
                      value={side.length}
                      onFocus={() => setActiveIndex(index)}
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

            <div className="mt-5 flex justify-end">
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
