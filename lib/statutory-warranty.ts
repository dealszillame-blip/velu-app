import type { InclusionItem } from "@/lib/proposal-breakdown";

/** NSW Home Building Act 1989 — always applies to residential building work. */
export const NSW_STATUTORY_WARRANTY =
  "NSW statutory warranties always apply under the Home Building Act: 6 years for major defects and 2 years for other defects. This is not optional and is not a missing tick.";

/**
 * Shown to the buyer and the builder after handover.
 * A record of the Act between those two parties. Not a Velu product and not a claim form.
 */
export const HANDOVER_STATUTORY_WARRANTY =
  "The statutory warranty is between the buyer and the builder under the NSW Home Building Act: 6 years for major defects and 2 years for other defects, starting when the build reached handover. Velu does not lodge claims, hold retention, or decide disputes.";

export function isWarrantyInclusion(item: InclusionItem): boolean {
  return (
    item.category === "warranty" ||
    /warranty/i.test(item.item) ||
    /warranty/i.test(item.detail)
  );
}

export function isStatutoryWarrantyItem(item: InclusionItem): boolean {
  return isWarrantyInclusion(item) && /statutory|home building act|6\s*year/i.test(
    `${item.item} ${item.detail}`
  );
}

export function isOptionalExtraWarranty(item: InclusionItem): boolean {
  return isWarrantyInclusion(item) && !isStatutoryWarrantyItem(item);
}

export function extraWarrantyCopy(item: InclusionItem): string {
  const detail = item.detail?.trim();
  if (detail) return `${item.item} — ${detail} (extra, on top of the statutory floor)`;
  return `${item.item} (extra, on top of the statutory floor)`;
}
