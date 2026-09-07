import { z } from "zod";

export const STOREY_OPTIONS = [
  { value: "ground_only", label: "Ground floor only" },
  { value: "ground_plus_one", label: "Ground + 1 (G+1)" },
  { value: "two_storey", label: "Two storey" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

export type StoreyPreference = (typeof STOREY_OPTIONS)[number]["value"];

export const HOUSE_TYPE_OPTIONS = [
  { value: "single_storey", label: "Single storey" },
  { value: "double_storey", label: "Double storey" },
  { value: "knockdown_rebuild", label: "Knockdown rebuild" },
  { value: "custom", label: "Custom / architect designed" },
  { value: "dual_occupancy", label: "Dual occupancy" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

export type HouseTypePreference = (typeof HOUSE_TYPE_OPTIONS)[number]["value"];

export const GRANNY_FLAT_OPTIONS = [
  { value: "yes", label: "Yes — include granny flat" },
  { value: "no", label: "No granny flat" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

export type GrannyFlatPreference = (typeof GRANNY_FLAT_OPTIONS)[number]["value"];

export const ENSUITE_OPTIONS = [
  { value: "yes", label: "Yes — ensuite to main bedroom" },
  { value: "no", label: "No ensuite" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

export type EnsuitePreference = (typeof ENSUITE_OPTIONS)[number]["value"];

export interface BuyerBuildRequirements {
  storeys: StoreyPreference;
  house_type?: HouseTypePreference;
  granny_flat: GrannyFlatPreference;
  bedrooms: number;
  bathrooms: number;
  car_spaces?: number;
  living_rooms?: number;
  ensuite?: EnsuitePreference;
  settlement_date?: string;
  land_size_sqm?: number;
  frontage_meters?: number;
  depth_meters?: number;
  left_side_meters?: number;
  right_side_meters?: number;
  floor_area_sqm?: number;
  additional_notes?: string;
}

export const defaultBuildRequirements = (): BuyerBuildRequirements => ({
  storeys: "not_sure",
  house_type: "not_sure",
  granny_flat: "not_sure",
  bedrooms: 4,
  bathrooms: 2,
  car_spaces: 2,
  living_rooms: 2,
  ensuite: "not_sure",
  settlement_date: "",
  additional_notes: "",
});

const optionalPositive = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.number().positive().optional()
);

export const buildRequirementsSchema = z.object({
  storeys: z.enum(["ground_only", "ground_plus_one", "two_storey", "not_sure"]),
  house_type: z
    .enum([
      "single_storey",
      "double_storey",
      "knockdown_rebuild",
      "custom",
      "dual_occupancy",
      "not_sure",
    ])
    .optional(),
  granny_flat: z.enum(["yes", "no", "not_sure"]),
  bedrooms: z.number().int().min(1).max(12),
  bathrooms: z.number().min(1).max(12),
  car_spaces: z.number().int().min(0).max(10).optional(),
  living_rooms: z.number().int().min(1).max(8).optional(),
  ensuite: z.enum(["yes", "no", "not_sure"]).optional(),
  settlement_date: z.string().max(32).optional(),
  land_size_sqm: optionalPositive,
  frontage_meters: optionalPositive,
  depth_meters: optionalPositive,
  left_side_meters: optionalPositive,
  right_side_meters: optionalPositive,
  floor_area_sqm: optionalPositive,
  additional_notes: z.string().max(1000).optional(),
});

export function normalizeBuildRequirements(
  raw: unknown
): BuyerBuildRequirements {
  const merged = {
    ...defaultBuildRequirements(),
    ...(raw && typeof raw === "object" ? raw : {}),
  };
  const parsed = buildRequirementsSchema.safeParse(merged);
  return parsed.success ? parsed.data : defaultBuildRequirements();
}

export function storeyLabel(value: StoreyPreference): string {
  return STOREY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function houseTypeLabel(value?: HouseTypePreference): string {
  if (!value) return "Not sure yet";
  return HOUSE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function grannyFlatLabel(value: GrannyFlatPreference): string {
  return GRANNY_FLAT_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function ensuiteLabel(value?: EnsuitePreference): string {
  if (!value) return "Not sure yet";
  return ENSUITE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function formatSettlementDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatBuildRequirementsSummary(
  req: BuyerBuildRequirements
): string {
  const parts = [
    houseTypeLabel(req.house_type),
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
