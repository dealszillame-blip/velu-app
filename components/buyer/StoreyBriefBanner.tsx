"use client";

import { Button } from "@/components/ui/button";
import type { BuyerBuildRequirements } from "@/lib/buyer-requirements";
import {
  applyNotesToStoreys,
  applyStoreysAsSourceOfTruth,
  notesIndicateSingleLevel,
  notesIndicateTwoStorey,
  storeyBriefContradiction,
  storeyLabel,
} from "@/lib/buyer-requirements";

type StoreyBriefBannerProps = {
  value: BuyerBuildRequirements;
  onChange: (value: BuyerBuildRequirements) => void;
  /** Buyer editor can confirm; builder lead page is read-only. */
  allowConfirm?: boolean;
};

export function StoreyBriefBanner({
  value,
  onChange,
  allowConfirm = false,
}: StoreyBriefBannerProps) {
  const contradiction = storeyBriefContradiction(value);
  if (!contradiction) return null;

  const notesSingle = notesIndicateSingleLevel(value.additional_notes);
  const notesTwo = notesIndicateTwoStorey(value.additional_notes);

  return (
    <div
      className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-900"
      role="status"
    >
      <p>{contradiction}</p>
      <p className="text-amber-800">
        Builders quote against <strong>Storeys</strong> ({storeyLabel(value.storeys)}
        ). House type is the product (knockdown, dual occ, custom) — not a second
        storey field.
      </p>
      {allowConfirm ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            onClick={() => onChange(applyStoreysAsSourceOfTruth(value))}
          >
            Keep {storeyLabel(value.storeys)}
          </Button>
          {(notesSingle || notesTwo) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => onChange(applyNotesToStoreys(value))}
            >
              Match storeys to notes
            </Button>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(value.brief_contradiction_acknowledged)}
              onChange={(e) =>
                onChange({
                  ...value,
                  brief_contradiction_acknowledged: e.target.checked,
                })
              }
            />
            Confirm and save anyway
          </label>
        </div>
      ) : null}
      {allowConfirm && !value.brief_contradiction_acknowledged ? (
        <p className="text-xs text-amber-800">
          Resolve or confirm before saving. Ranking follows Storeys unless you
          match notes.
        </p>
      ) : null}
    </div>
  );
}
