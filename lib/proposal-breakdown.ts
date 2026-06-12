export type PriceBreakdownLine = {
  category: string;
  label: string;
  amount: number;
  note?: string;
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
  price_breakdown: PriceBreakdownLine[];
  inclusion_items: InclusionItem[];
  home_specs: HomeSpecs;
};

export const BREAKDOWN_CATEGORIES = [
  { value: "site", label: "Site & connections" },
  { value: "base", label: "Base build" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "flooring", label: "Flooring" },
  { value: "electrical", label: "Electrical & AC" },
  { value: "external", label: "External & landscaping" },
  { value: "driveway", label: "Driveway & paths" },
  { value: "contingency", label: "Contingency allowance" },
  { value: "other", label: "Other" },
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
    { category: "site", label: "Site costs & connections (est.)", amount: 0 },
    { category: "base", label: "Base build to lock-up (est.)", amount: 0 },
    { category: "kitchen", label: "Kitchen package (est.)", amount: 0 },
    { category: "bathroom", label: "Bathroom package (est.)", amount: 0 },
    { category: "flooring", label: "Floor coverings (est.)", amount: 0 },
    { category: "electrical", label: "Electrical & ducted AC (est.)", amount: 0 },
    { category: "external", label: "Landscaping allowance (est.)", amount: 0 },
    { category: "driveway", label: "Driveway & paths (est.)", amount: 0 },
    { category: "contingency", label: "Contingency (est.)", amount: 0 },
  ];
}

export function defaultInclusionItems(): InclusionItem[] {
  return [
    { category: "structure", item: "Fixed-price HIA contract", detail: "Standard residential build contract", included: true },
    { category: "structure", item: "Structural warranty", detail: "10 years (est.)", included: true },
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

export function templateToFormState(template: ProposalTemplate): ProposalFormState {
  const total = sumBreakdown(template.price_breakdown);
  return {
    package_name: template.package_name,
    base_price: total > 0 ? String(total) : "",
    estimated_build_weeks: template.estimated_build_weeks
      ? String(template.estimated_build_weeks)
      : "",
    notes: template.notes ?? "",
    price_breakdown: template.price_breakdown.length
      ? template.price_breakdown
      : defaultBreakdownLines(),
    inclusion_items: template.inclusion_items.length
      ? template.inclusion_items
      : defaultInclusionItems(),
    home_specs: template.home_specs ?? {},
  };
}
