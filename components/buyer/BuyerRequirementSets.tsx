"use client";

import { BuyerBuildRequirementsFields } from "@/components/buyer/BuyerBuildRequirementsFields";
import { Button } from "@/components/ui/button";
import {
  LAND_PURPOSE_OPTIONS,
  MAX_REQUIREMENT_SETS,
  defaultBuildRequirements,
  type BuyerBuildRequirements,
  type LandPurpose,
} from "@/lib/buyer-requirements";
import { cn } from "@/lib/utils";

type BuyerRequirementSetsProps = {
  purpose: LandPurpose | "";
  onPurposeChange: (purpose: LandPurpose) => void;
  sets: BuyerBuildRequirements[];
  onSetsChange: (sets: BuyerBuildRequirements[]) => void;
  idPrefix?: string;
  hideLandMeasurements?: boolean;
  hideBuilderTypes?: boolean;
};

export function BuyerRequirementSets({
  purpose,
  onPurposeChange,
  sets,
  onSetsChange,
  idPrefix = "requirements",
  hideLandMeasurements = false,
  hideBuilderTypes = false,
}: BuyerRequirementSetsProps) {
  function updateSet(index: number, next: BuyerBuildRequirements) {
    onSetsChange(sets.map((set, i) => (i === index ? next : set)));
  }

  function addSet() {
    if (sets.length >= MAX_REQUIREMENT_SETS) return;
    onSetsChange([...sets, defaultBuildRequirements()]);
  }

  function removeSet(index: number) {
    onSetsChange(sets.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          Is this land for personal use or investment?
        </legend>
        <p className="text-sm text-muted-foreground">
          Personal means you will live here. Investment means the block is for a return.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {LAND_PURPOSE_OPTIONS.map((option) => {
            const selected = purpose === option.value;
            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-foreground"
                )}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name={`${idPrefix}-purpose`}
                  value={option.value}
                  required
                  checked={selected}
                  onChange={() => onPurposeChange(option.value)}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {sets.map((set, index) => (
        <div key={`${idPrefix}-set-${index}`} className="space-y-4 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Requirement {index + 1}</p>
            {index > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => removeSet(index)}
              >
                Remove
              </Button>
            ) : null}
          </div>
          <BuyerBuildRequirementsFields
            value={set}
            onChange={(next) => updateSet(index, next)}
            idPrefix={`${idPrefix}-${index}`}
            hideLandMeasurements={hideLandMeasurements}
            hideIntro
            hideBuilderTypes={hideBuilderTypes}
          />
        </div>
      ))}

      {sets.length < MAX_REQUIREMENT_SETS ? (
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={addSet}
        >
          Add another requirement
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          {MAX_REQUIREMENT_SETS} requirements is the maximum for one block.
        </p>
      )}
    </div>
  );
}
