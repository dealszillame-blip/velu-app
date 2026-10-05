import type { ContractType, LineKind } from "@/lib/quote-structure";
import { defaultLineKind } from "@/lib/quote-structure";

export type PriceBreakdownLine = {
  category: string;
  label: string;
  amount: number;
  note?: string;
  line_kind?: LineKind;
  provisional?: boolean;
};

export type InclusionItem = {
  category: string;
  item: string;
  detail: string;
  included: boolean;
};

export type HomeSpecs = {
  bedrooms?: number;
  bathrooms?: number;
  car_spaces?: number;
  living_area_sqm?: number;
  storeys?: number;
};

export type ProposalTemplate = {
  id: string;
  builder_id: string;
  name: string;
  package_name: string;
  estimated_build_weeks: number | null;
  notes: string | null;
  contract_type?: ContractType | null;
  price_breakdown: PriceBreakdownLine[];
  inclusion_items: InclusionItem[];
  home_specs: HomeSpecs;
  created_at: string;
  updated_at: string;
};

export type ProposalFormState = {
  package_name: string;
  base_price: string;
  estimated_build_weeks: string;
  notes: string;
  contract_type: ContractType | "";
  price_breakdown: PriceBreakdownLine[];
  inclusion_items: InclusionItem[];
  home_specs: HomeSpecs;
};

export const BREAKDOWN_CATEGORIES = [
  { value: "site", label: "Site & connections" },
  { value: "base", label: "Base build" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "electrical", label: "Electrical & AC" },
  { value: "external", label: "External & landscaping" },
  { value: "contingency", label: "Contingency" },
  { value: "pc", label: "Prime cost (PC)" },
  { value: "ps", label: "Provisional sum (PS)" },
] as const;

export const INCLUSION_CATEGORIES = [
  { value: "structure", label: "Structure" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "flooring", label: "Flooring" },
  { value: "electrical", label: "Electrical & climate" },
  { value: "external", label: "External" },
  { value: "energy", label: "Energy & water" },
  { value: "warranty", label: "Warranty & compliance" },
] as const;

export function defaultBreakdownLines(): PriceBreakdownLine[] {
  return [
    {
      category: "site",
      label: "Estimated site costs & connections",
      amount: 0,
      line_kind: "allowance",
      provisional: true,
    },
    {
      category: "base",
      label: "Base build to lock-up (est.)",
      amount: 0,
      line_kind: "lump_sum",
    },
    {
      category: "kitchen",
      label: "Kitchen package (est.)",
      amount: 0,
      line_kind: "lump_sum",
    },
    {
      category: "bathroom",
      label: "Bathroom package (est.)",
      amount: 0,
      line_kind: "lump_sum",
    },
    {
      category: "electrical",
      label: "Electrical & ducted AC (est.)",
      amount: 0,
      line_kind: "lump_sum",
    },
    {
      category: "external",
      label: "External & landscaping (est.)",
      amount: 0,
      line_kind: "allowance",
    },
    {
      category: "contingency",
      label: "Contingency (est.)",
      amount: 0,
      line_kind: "allowance",
    },
    {
      category: "pc",
      label: "Prime cost items (est.)",
      amount: 0,
      line_kind: "pc",
    },
    {
      category: "ps",
      label: "Provisional sums (est.)",
      amount: 0,
      line_kind: "ps",
    },
  ];
}

export function defaultInclusionItems(): InclusionItem[] {
  return [
    { category: "structure", item: "Fixed-price HIA contract", detail: "Standard residential build contract", included: true },
    { category: "warranty", item: "Extra structural warranty", detail: "Optional extra on top of NSW statutory warranties (6yr major / 2yr other)", included: false },
    { category: "kitchen", item: "Stone benchtops", detail: "20mm engineered stone — allowance", included: true },
    { category: "kitchen", item: "900mm appliances", detail: "Oven, cooktop, rangehood — allowance", included: true },
    { category: "bathroom", item: "Main bathroom package", detail: "Wall-hung vanity, semi-frameless shower", included: true },
    { category: "flooring", item: "Floor coverings", detail: "Hybrid timber to living, carpet to beds", included: true },
    { category: "electrical", item: "Ducted air conditioning", detail: "Reverse-cycle to living + beds", included: true },
    { category: "external", item: "Front landscaping", detail: "Basic turf and garden allowance", included: false },
    { category: "energy", item: "Solar-ready roof", detail: "Pre-wired for future panels", included: true },
    { category: "warranty", item: "PCI & handover", detail: "Practical completion inspection included", included: true },
  ];
}

export function emptyFormState(): ProposalFormState {
  return {
    package_name: "",
    base_price: "",
    estimated_build_weeks: "",
    notes: "",
    contract_type: "",
    price_breakdown: defaultBreakdownLines(),
    inclusion_items: defaultInclusionItems(),
    home_specs: { bedrooms: 4, bathrooms: 2, car_spaces: 2, living_area_sqm: 220, storeys: 2 },
  };
}

export function sumBreakdown(lines: PriceBreakdownLine[]): number {
  return lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
}

export function categoryLabel(
  categories: readonly { value: string; label: string }[],
  value: string
): string {
  return categories.find((c) => c.value === value)?.label ?? value;
}

export function formatInclusionsSummary(items: InclusionItem[]): string {
  return items
    .filter((i) => i.included)
    .map((i) => i.item)
    .slice(0, 6)
    .join(", ");
}

export function withDefaultLineKind(line: PriceBreakdownLine): PriceBreakdownLine {
  return {
    ...line,
    line_kind: line.line_kind ?? defaultLineKind(line.category),
    provisional:
      line.provisional ?? (line.category === "site" ? true : undefined),
  };
}

export function templateToFormState(template: ProposalTemplate): ProposalFormState {
  const lines = (template.price_breakdown.length
    ? template.price_breakdown
    : defaultBreakdownLines()
  ).map(withDefaultLineKind);
  const total = sumBreakdown(lines);
  return {
    package_name: template.package_name,
    base_price: total > 0 ? String(total) : "",
    estimated_build_weeks: template.estimated_build_weeks
      ? String(template.estimated_build_weeks)
      : "",
    notes: template.notes ?? "",
    contract_type: template.contract_type ?? "",
    price_breakdown: lines,
    inclusion_items: template.inclusion_items.length
      ? template.inclusion_items
      : defaultInclusionItems(),
    home_specs: template.home_specs ?? {},
  };
}

export function proposalToFormState(proposal: {
  package_name: string;
  base_price: number;
  estimated_build_weeks?: number | null;
  notes?: string | null;
  contract_type?: ContractType | null;
  price_breakdown?: PriceBreakdownLine[] | null;
  inclusion_items?: InclusionItem[] | null;
  home_specs?: HomeSpecs | null;
}): ProposalFormState {
  const lines = (proposal.price_breakdown?.length
    ? proposal.price_breakdown
    : defaultBreakdownLines()
  ).map(withDefaultLineKind);
  const total = sumBreakdown(lines);
  return {
    package_name: proposal.package_name,
    base_price: total > 0 ? String(total) : String(proposal.base_price ?? ""),
    estimated_build_weeks: proposal.estimated_build_weeks
      ? String(proposal.estimated_build_weeks)
      : "",
    notes: proposal.notes ?? "",
    contract_type: proposal.contract_type ?? "",
    price_breakdown: lines,
    inclusion_items: proposal.inclusion_items?.length
      ? proposal.inclusion_items
      : defaultInclusionItems(),
    home_specs: proposal.home_specs ?? {},
  };
}
