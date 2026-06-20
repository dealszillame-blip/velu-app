import { z } from "zod";

export const STOREY_OPTIONS = [
  { value: "ground_only", label: "Ground floor only" },
  { value: "ground_plus_one", label: "Ground + 1 (G+1)" },
  { value: "two_storey", label: "Two storey" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

export type StoreyPreference = (typeof STOREY_OPTIONS)[number]["value"];

export const GRANNY_FLAT_OPTIONS = [
  { value: "yes", label: "Yes — include granny flat" },
  { value: "no", label: "No granny flat" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

export type GrannyFlatPreference = (typeof GRANNY_FLAT_OPTIONS)[number]["value"];

export interface BuyerBuildRequirements {
  storeys: StoreyPreference;
  granny_flat: GrannyFlatPreference;
  bedrooms: number;
  bathrooms: number;
  car_spaces?: number;
  additional_notes?: string;
}

export const defaultBuildRequirements = (): BuyerBuildRequirements => ({
  storeys: "not_sure",
  granny_flat: "not_sure",
  bedrooms: 4,
  bathrooms: 2,
  car_spaces: 2,
  additional_notes: "",
});

export const buildRequirementsSchema = z.object({
  storeys: z.enum(["ground_only", "ground_plus_one", "two_storey", "not_sure"]),
  granny_flat: z.enum(["yes", "no", "not_sure"]),
  bedrooms: z.number().int().min(1).max(12),
  bathrooms: z.number().min(1).max(12),
  car_spaces: z.number().int().min(0).max(10).optional(),
  additional_notes: z.string().max(1000).optional(),
});

export function storeyLabel(value: StoreyPreference): string {
  return STOREY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function grannyFlatLabel(value: GrannyFlatPreference): string {
  return GRANNY_FLAT_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function formatBuildRequirementsSummary(
  req: BuyerBuildRequirements
): string {
  const parts = [
    storeyLabel(req.storeys),
    grannyFlatLabel(req.granny_flat),
    `${req.bedrooms} bed`,
    `${req.bathrooms} bath`,
  ];
  if (req.car_spaces != null && req.car_spaces > 0) {
    parts.push(`${req.car_spaces} car`);
  }
  return parts.join(" · ");
}
