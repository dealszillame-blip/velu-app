import { z } from "zod";
import { builderTypeLabel } from "@/lib/builder-types";

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
  { value: "knockdown_rebuild", label: "Knock-down rebuild" },
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

export const CONSTRUCTION_GRADE_OPTIONS = [
  { value: "ground", label: "Ground" },
  { value: "medium", label: "Medium" },
  { value: "luxury", label: "Luxury" },
] as const;

export type ConstructionGrade = (typeof CONSTRUCTION_GRADE_OPTIONS)[number]["value"];

export const LAND_PURPOSE_OPTIONS = [
  { value: "personal", label: "Personal" },
  { value: "investment", label: "Investment" },
  { value: "knockdown_rebuild", label: "Knock-down rebuild" },
] as const;

export type LandPurpose = (typeof LAND_PURPOSE_OPTIONS)[number]["value"];

export const MAX_REQUIREMENT_SETS = 6;

export const BOUNDARY_SIDE_LABELS = [
  "Front",
  "Left",
  "Rear",
  "Right",
  "Side 5",
  "Side 6",
  "Side 7",
  "Side 8",
] as const;

export const MIN_BOUNDARY_SIDES = 4;
export const MAX_BOUNDARY_SIDES = BOUNDARY_SIDE_LABELS.length;

export type BoundarySide = {
  label: string;
  length_meters: number;
};

export type BoundarySideInput = {
  label: string;
  length: string;
};

export const SITE_DOCUMENT_OPTIONS = [
  { key: "land_drawings", label: "Land drawings" },
  { key: "site_drawings", label: "Site drawings" },
  { key: "certificate_10_7", label: "Certificate 10.7" },
  { key: "contour_plan", label: "Contour plan, if available" },
] as const;

export type SiteDocumentKey = (typeof SITE_DOCUMENT_OPTIONS)[number]["key"];

export type SiteDocumentRecord = {
  key: SiteDocumentKey;
  file_name?: string;
};

export function defaultBoundaryInputs(count = MIN_BOUNDARY_SIDES): BoundarySideInput[] {
  return BOUNDARY_SIDE_LABELS.slice(0, count).map((label) => ({
    label,
    length: "",
  }));
}

export function resizeBoundaryInputs(
  current: BoundarySideInput[],
  count: number
): BoundarySideInput[] {
  const nextCount = Math.min(MAX_BOUNDARY_SIDES, Math.max(MIN_BOUNDARY_SIDES, count));
  return BOUNDARY_SIDE_LABELS.slice(0, nextCount).map((label, index) => ({
    label: current[index]?.label?.trim() || label,
    length: current[index]?.length ?? "",
  }));
}

export interface BuyerBuildRequirements {
  storeys: StoreyPreference;
  house_type?: HouseTypePreference;
  granny_flat: GrannyFlatPreference;
  bedrooms: number;
  bathrooms: number;
  car_spaces?: number;
  living_rooms?: number;
  ensuite?: EnsuitePreference;
  construction_grade?: ConstructionGrade;
  preferred_builder_types?: string[];
  settlement_date?: string;
  land_size_sqm?: number;
  frontage_meters?: number;
  depth_meters?: number;
  left_side_meters?: number;
  right_side_meters?: number;
  floor_area_sqm?: number;
  additional_notes?: string;
  /** Buyer confirmed a remaining storey/notes mismatch so save can proceed. */
  brief_contradiction_acknowledged?: boolean;
  /** Whether the block is a home to live in, an investment, or a knock-down rebuild. */
  purpose?: LandPurpose;
  /** Length of each boundary, starting at 4 sides. */
  boundary_sides?: BoundarySide[];
  /** Drawings and certificates the buyer already holds. */
  site_documents?: SiteDocumentRecord[];
  /** Further briefs for the same block. The first brief stays the one used for matching. */
  additional_requirements?: BuyerBuildRequirements[];
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
  construction_grade: "medium",
  preferred_builder_types: [],
  settlement_date: "",
  additional_notes: "",
});

const optionalPositive = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.number().positive().optional()
);

const requirementSetSchema = z.object({
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
  construction_grade: z.enum(["ground", "medium", "luxury"]).optional(),
  preferred_builder_types: z
    .array(z.enum(["bulk", "semi_custom", "custom", "designer"]))
    .max(4)
    .optional(),
  settlement_date: z.string().max(32).optional(),
  land_size_sqm: optionalPositive,
  frontage_meters: optionalPositive,
  depth_meters: optionalPositive,
  left_side_meters: optionalPositive,
  right_side_meters: optionalPositive,
  floor_area_sqm: optionalPositive,
  additional_notes: z.string().max(1000).optional(),
  brief_contradiction_acknowledged: z.boolean().optional(),
});

const boundarySideSchema = z.object({
  label: z.string().trim().min(1).max(40),
  length_meters: z.number().positive(),
});

const siteDocumentSchema = z.object({
  key: z.enum(["land_drawings", "site_drawings", "certificate_10_7", "contour_plan"]),
  file_name: z.string().trim().min(1).max(180).optional(),
});

export const buildRequirementsSchema = requirementSetSchema.extend({
  purpose: z.enum(["personal", "investment", "knockdown_rebuild"]).optional(),
  boundary_sides: z.array(boundarySideSchema).min(4).max(8).optional(),
  site_documents: z.array(siteDocumentSchema).max(4).optional(),
  additional_requirements: z.array(requirementSetSchema).max(5).optional(),
});

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

function parseRequirementSet(raw: unknown): BuyerBuildRequirements | null {
  const parsed = requirementSetSchema.safeParse({
    ...defaultBuildRequirements(),
    ...asRecord(raw),
  });
  return parsed.success ? parsed.data : null;
}

export function normalizeBuildRequirements(
  raw: unknown
): BuyerBuildRequirements {
  const source = asRecord(raw);
  const {
    additional_requirements: extras,
    purpose,
    boundary_sides: rawSides,
    site_documents: rawDocuments,
    ...rest
  } = source;
  const primary = parseRequirementSet(rest) ?? defaultBuildRequirements();
  const additional = Array.isArray(extras)
    ? extras
        .map((item) => parseRequirementSet(item))
        .filter((item): item is BuyerBuildRequirements => item != null)
        .slice(0, MAX_REQUIREMENT_SETS - 1)
    : [];
  const parsedPurpose =
    purpose === "personal" || purpose === "investment" || purpose === "knockdown_rebuild"
      ? purpose
      : undefined;
  const boundarySides = z.array(boundarySideSchema).max(8).safeParse(rawSides);
  const siteDocuments = z.array(siteDocumentSchema).max(4).safeParse(rawDocuments);

  return {
    ...primary,
    ...(parsedPurpose ? { purpose: parsedPurpose } : {}),
    ...(boundarySides.success && boundarySides.data.length >= MIN_BOUNDARY_SIDES
      ? { boundary_sides: boundarySides.data }
      : {}),
    ...(siteDocuments.success && siteDocuments.data.length
      ? { site_documents: siteDocuments.data }
      : {}),
    ...(additional.length ? { additional_requirements: additional } : {}),
  };
}

export function purposeLabel(value?: LandPurpose): string {
  if (!value) return "Not chosen";
  return LAND_PURPOSE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function purposeSaveBlocked(req: BuyerBuildRequirements): string | null {
  if (
    req.purpose !== "personal" &&
    req.purpose !== "investment" &&
    req.purpose !== "knockdown_rebuild"
  ) {
    return "Choose personal, investment, or knock-down rebuild.";
  }
  return null;
}

export function parseBoundarySides(
  inputs: BoundarySideInput[]
): { sides: BoundarySide[] } | { error: string } {
  if (inputs.length < MIN_BOUNDARY_SIDES) {
    return { error: "Add the length of at least 4 sides." };
  }
  const sides: BoundarySide[] = [];
  for (const [index, input] of inputs.entries()) {
    const length = Number(input.length);
    if (!input.length.trim() || !Number.isFinite(length) || length <= 0) {
      return { error: `Enter the length of ${input.label || `side ${index + 1}`}.` };
    }
    sides.push({
      label: input.label.trim() || BOUNDARY_SIDE_LABELS[index] || `Side ${index + 1}`,
      length_meters: length,
    });
  }
  return { sides };
}

export function measurementsFromSides(sides: BoundarySide[]) {
  return {
    frontage_meters: sides[0]?.length_meters,
    left_side_meters: sides[1]?.length_meters,
    depth_meters: sides[2]?.length_meters,
    right_side_meters: sides[3]?.length_meters,
  };
}

export function siteDocumentLabel(key: SiteDocumentKey): string {
  return SITE_DOCUMENT_OPTIONS.find((option) => option.key === key)?.label ?? key;
}

function withoutNestedBrief(req: BuyerBuildRequirements): BuyerBuildRequirements {
  const fields = { ...req };
  delete fields.purpose;
  delete fields.additional_requirements;
  delete fields.boundary_sides;
  delete fields.site_documents;
  return fields;
}

export function splitRequirementSets(
  req: BuyerBuildRequirements
): BuyerBuildRequirements[] {
  return [
    { ...defaultBuildRequirements(), ...withoutNestedBrief(req) },
    ...(req.additional_requirements ?? []).map((set) => ({
      ...defaultBuildRequirements(),
      ...withoutNestedBrief(set),
    })),
  ];
}

export function composeBuildRequirements(
  purpose: LandPurpose | "",
  sets: BuyerBuildRequirements[],
  carry?: Pick<BuyerBuildRequirements, "boundary_sides" | "site_documents">
): BuyerBuildRequirements {
  const [primary = defaultBuildRequirements(), ...rest] = sets;
  const additional = rest.slice(0, MAX_REQUIREMENT_SETS - 1).map((set) => ({
    ...defaultBuildRequirements(),
    ...withoutNestedBrief(set),
  }));
  const brief = withoutNestedBrief(primary);
  if (
    purpose === "knockdown_rebuild" &&
    (!brief.house_type || brief.house_type === "not_sure")
  ) {
    brief.house_type = "knockdown_rebuild";
  }

  return {
    ...defaultBuildRequirements(),
    ...brief,
    ...(purpose === "personal" ||
    purpose === "investment" ||
    purpose === "knockdown_rebuild"
      ? { purpose }
      : {}),
    ...(carry?.boundary_sides?.length ? { boundary_sides: carry.boundary_sides } : {}),
    ...(carry?.site_documents?.length ? { site_documents: carry.site_documents } : {}),
    ...(additional.length ? { additional_requirements: additional } : {}),
  };
}

export function storeyLabel(value: StoreyPreference): string {
  return STOREY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** Prefer the explicit storeys field. house_type is only a fallback when storeys is "not sure". */
export function wantedStoreyCount(req: BuyerBuildRequirements | null): number | null {
  if (!req) return null;
  if (req.storeys === "ground_only") return 1;
  if (req.storeys === "ground_plus_one" || req.storeys === "two_storey") return 2;
  if (req.house_type === "single_storey") return 1;
  if (req.house_type === "double_storey") return 2;
  return null;
}

export function notesIndicateSingleLevel(notes?: string): boolean {
  if (!notes) return false;
  const text = notes.toLowerCase();
  const single = /single[-\s]?level|single[-\s]?stor(e)?y|ground[-\s]?floor only|single[-\s]?level living/.test(
    text
  );
  const two = /double[-\s]?stor(e)?y|two[-\s]?stor(e)?y|g\s*\+\s*1|first[-\s]?floor bedrooms/.test(
    text
  );
  return single && !two;
}

export function notesIndicateTwoStorey(notes?: string): boolean {
  if (!notes) return false;
  const text = notes.toLowerCase();
  return /double[-\s]?stor(e)?y|two[-\s]?stor(e)?y|g\s*\+\s*1/.test(text);
}

export function storeyBriefContradiction(
  req: BuyerBuildRequirements
): string | null {
  const structured = wantedStoreyCount(req);
  const notes = req.additional_notes;
  if (structured === 2 && notesIndicateSingleLevel(notes)) {
    return "Structured storeys are G+1 / two-storey, but your notes say single-level living.";
  }
  if (structured === 1 && notesIndicateTwoStorey(notes)) {
    return "Structured storeys are single-level, but your notes describe a two-storey home.";
  }
  if (
    req.storeys === "ground_only" &&
    req.house_type === "double_storey"
  ) {
    return "House type is double storey, but storeys is ground floor only.";
  }
  if (
    (req.storeys === "ground_plus_one" || req.storeys === "two_storey") &&
    req.house_type === "single_storey"
  ) {
    return "House type is single storey, but storeys is G+1 / two-storey.";
  }
  return null;
}

function requirementSetBlocked(
  req: BuyerBuildRequirements,
  label: string
): string | null {
  const contradiction = storeyBriefContradiction(req);
  if (contradiction && !req.brief_contradiction_acknowledged) {
    return `${label}: ${contradiction} Confirm one brief before saving.`;
  }
  return null;
}

/** Prefer the Storeys field: align house_type when it is a storey synonym. */
export function applyStoreysAsSourceOfTruth(
  req: BuyerBuildRequirements
): BuyerBuildRequirements {
  if (req.storeys === "ground_only" && req.house_type === "double_storey") {
    return {
      ...req,
      house_type: "single_storey",
      brief_contradiction_acknowledged: false,
    };
  }
  if (
    (req.storeys === "ground_plus_one" || req.storeys === "two_storey") &&
    req.house_type === "single_storey"
  ) {
    return {
      ...req,
      house_type: "double_storey",
      brief_contradiction_acknowledged: false,
    };
  }
  return { ...req, brief_contradiction_acknowledged: false };
}

/** Align structured storeys (and house_type if it is a storey synonym) to notes. */
export function applyNotesToStoreys(
  req: BuyerBuildRequirements
): BuyerBuildRequirements {
  if (notesIndicateSingleLevel(req.additional_notes)) {
    return {
      ...req,
      storeys: "ground_only",
      house_type:
        req.house_type === "double_storey" ? "single_storey" : req.house_type,
      brief_contradiction_acknowledged: false,
    };
  }
  if (notesIndicateTwoStorey(req.additional_notes)) {
    return {
      ...req,
      storeys: "ground_plus_one",
      house_type:
        req.house_type === "single_storey" ? "double_storey" : req.house_type,
      brief_contradiction_acknowledged: false,
    };
  }
  return req;
}

export function briefSaveBlocked(req: BuyerBuildRequirements): string | null {
  const primary = requirementSetBlocked(req, "Requirement 1");
  if (primary) return primary;
  for (const [index, extra] of (req.additional_requirements ?? []).entries()) {
    const blocked = requirementSetBlocked(extra, `Requirement ${index + 2}`);
    if (blocked) return blocked;
  }
  return null;
}

/**
 * Scoring should not punish a 1-storey package when the buyer’s own notes
 * clearly ask for single-level living, even if the structured field says G+1.
 */
export function shouldPenaliseStoreyMismatch(
  req: BuyerBuildRequirements,
  packageStoreys: number
): boolean {
  const wanted = wantedStoreyCount(req);
  if (!wanted || packageStoreys === wanted) return false;
  if (packageStoreys === 1 && notesIndicateSingleLevel(req.additional_notes)) {
    return false;
  }
  return true;
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

export function constructionGradeLabel(value?: ConstructionGrade): string {
  if (!value) return "Not sure yet";
  return CONSTRUCTION_GRADE_OPTIONS.find((o) => o.value === value)?.label ?? value;
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
    ...(req.purpose ? [purposeLabel(req.purpose)] : []),
    houseTypeLabel(req.house_type),
    storeyLabel(req.storeys),
    grannyFlatLabel(req.granny_flat),
    `${req.bedrooms} bed`,
    `${req.bathrooms} bath`,
  ];
  if (req.construction_grade) {
    parts.push(constructionGradeLabel(req.construction_grade));
  }
  if (req.preferred_builder_types?.length) {
    parts.push(
      req.preferred_builder_types.map((type) => builderTypeLabel(type)).join(" / ")
    );
  }
  if (req.car_spaces != null && req.car_spaces > 0) {
    parts.push(`${req.car_spaces} car`);
  }
  return parts.join(" · ");
}
