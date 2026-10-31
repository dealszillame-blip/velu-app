"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function selectSide(index: number) {
    setActiveIndex(index);
    setOpen(true);
    if (window.matchMedia("(min-width: 640px)").matches) {
      window.setTimeout(() => {
        document.getElementById(`${idPrefix}-length-${index}`)?.focus();
      }, 0);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Land sketch</p>
        <p className="text-sm text-muted-foreground">
          The drawing stays on this page. Enter each side in order, starting at the front.
          After you save, you and your builder both see this sketch.
        </p>
      </div>
      <LandSketch
        labels={sides.map((side) => side.label)}
        lengths={lengths}
        activeIndex={activeIndex}
        onSelect={selectSide}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          Enter side lengths
        </Button>
        <p className="text-sm text-muted-foreground">
          {sides.length} sides
          {entered > 0 ? ` · ${entered} entered` : " · lengths not entered yet"}
        </p>
      </div>

      {open
        ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/45 p-3 sm:items-center sm:p-6"
          onMouseDown={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${idPrefix}-sketch-title`}
            className="flex max-h-full min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-md border border-border bg-card shadow-[6px_6px_0_var(--surface-subtle)]"
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="space-y-1">
                <h2 id={`${idPrefix}-sketch-title`} className="text-lg font-semibold tracking-tight">
                  Sketch your block
                </h2>
                <p className="text-sm text-muted-foreground">
                  Start at side 1, the front, and go around in order.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <LandSketch
              labels={sides.map((side) => side.label)}
              lengths={lengths}
              activeIndex={activeIndex}
              onSelect={selectSide}
            />
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

            <div className="mt-5 grid gap-3 sm:max-w-sm">
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

            </div>
            <div className="flex shrink-0 justify-end border-t border-border px-5 py-3">
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>,
          document.body
        )
        : null}
    </div>
  );
}
