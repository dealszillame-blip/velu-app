import type {
  HomeSpecs,
  InclusionItem,
  PriceBreakdownLine,
} from "@/lib/proposal-breakdown";
import type { ContractType } from "@/lib/quote-structure";

export type DemoProposalTemplate = {
  key: string;
  package_name: string;
  base_price: number;
  estimated_build_weeks: number;
  contract_type: ContractType;
  inclusions: string;
  notes: string;
  home_specs: HomeSpecs;
  price_breakdown: PriceBreakdownLine[];
  inclusion_items: InclusionItem[];
};

export const DEMO_COMPARISON_TEMPLATES: DemoProposalTemplate[] = [
  {
    key: "value_single_studio",
    package_name: "Oran Park Single + Studio",
    base_price: 498000,
    estimated_build_weeks: 28,
    contract_type: "fixed_price",
    inclusions:
      "Granny-flat studio, stone benchtops, ducted AC, double garage, 10-year warranty",
    notes:
      "Demonstration package. Ground-floor living with a rear granny-flat studio. Site costs are an estimate until a soil report is delivered.",
    home_specs: {
      bedrooms: 4,
      bathrooms: 3,
      car_spaces: 2,
      living_area_sqm: 198,
      storeys: 1,
    },
    price_breakdown: [
      { category: "site", label: "Estimated site costs & connections", amount: 42000, line_kind: "allowance", provisional: true },
      { category: "base", label: "Base build to lock-up (est.)", amount: 268000, line_kind: "lump_sum" },
      { category: "kitchen", label: "Kitchen package (est.)", amount: 28000, line_kind: "lump_sum" },
      { category: "bathroom", label: "Bathroom + ensuite (est.)", amount: 32000, line_kind: "lump_sum" },
      { category: "electrical", label: "Electrical & ducted AC (est.)", amount: 26000, line_kind: "lump_sum" },
      { category: "external", label: "Granny flat studio fit-out (est.)", amount: 62000, line_kind: "lump_sum" },
      { category: "contingency", label: "Contingency (est.)", amount: 22000, line_kind: "allowance" },
      { category: "pc", label: "Prime cost items (est.)", amount: 0, line_kind: "pc" },
      { category: "ps", label: "Provisional sums (est.)", amount: 18000, line_kind: "ps" },
    ],
    inclusion_items: [
      { category: "kitchen", item: "Stone benchtops", detail: "40mm engineered stone", included: true },
      { category: "electrical", item: "Ducted air conditioning", detail: "2 zones", included: true },
      { category: "external", item: "Granny flat / studio", detail: "Self-contained rear studio", included: true },
      { category: "external", item: "Double garage", detail: "Remote doors", included: true },
      { category: "warranty", item: "Extra structural warranty", detail: "10 years on top of NSW statutory warranties", included: true },
    ],
  },
  {
    key: "family_five_premium",
    package_name: "Hawkesbury 25 Dual Living",
    base_price: 548000,
    estimated_build_weeks: 33,
    contract_type: "hybrid",
    inclusions:
      "5-bed single storey, granny flat, stone, ducted AC, solar-ready, landscaping",
    notes:
      "Demonstration package. Closest match to a 5-bed + granny-flat brief. Site costs are an estimate for R2 estate lots until soil is classified.",
    home_specs: {
      bedrooms: 5,
      bathrooms: 3,
      car_spaces: 2,
      living_area_sqm: 246,
      storeys: 1,
    },
    price_breakdown: [
      { category: "site", label: "Estimated site costs & connections", amount: 48000, line_kind: "allowance", provisional: true },
      { category: "base", label: "Base build to lock-up (est.)", amount: 292000, line_kind: "lump_sum" },
      { category: "kitchen", label: "Kitchen package (est.)", amount: 34000, line_kind: "lump_sum" },
      { category: "bathroom", label: "3-way bathroom package (est.)", amount: 38000, line_kind: "lump_sum" },
      { category: "electrical", label: "Electrical & ducted AC (est.)", amount: 28000, line_kind: "lump_sum" },
      { category: "external", label: "Granny flat + landscaping (est.)", amount: 72000, line_kind: "allowance" },
      { category: "contingency", label: "Contingency (est.)", amount: 24000, line_kind: "allowance" },
      { category: "pc", label: "Prime cost items (est.)", amount: 0, line_kind: "pc" },
    ],
    inclusion_items: [
      { category: "kitchen", item: "Stone benchtops", detail: "40mm stone + butler's pantry", included: true },
      { category: "electrical", item: "Ducted air conditioning", detail: "3 zones", included: true },
      { category: "external", item: "Granny flat / studio", detail: "1-bed self-contained", included: true },
      { category: "energy", item: "Solar ready", detail: "Inverter wiring included", included: true },
      { category: "external", item: "Alfresco", detail: "Tiled outdoor living", included: true },
      { category: "warranty", item: "Extra structural warranty", detail: "10 years + 2-year defects on top of NSW statutory warranties", included: true },
    ],
  },
  {
    key: "double_storey_value",
    package_name: "The Campbell 220",
    base_price: 468000,
    estimated_build_weeks: 26,
    contract_type: "cost_plus",
    inclusions: "Engineered stone, split-system AC, Colorbond roof, double garage",
    notes:
      "Demonstration package. Fastest programme. Site costs are an estimate — no granny flat and no ducted AC.",
    home_specs: {
      bedrooms: 4,
      bathrooms: 2,
      car_spaces: 2,
      living_area_sqm: 186,
      storeys: 2,
    },
    price_breakdown: [
      { category: "site", label: "Estimated site costs & connections", amount: 36000, line_kind: "allowance", provisional: true },
      { category: "base", label: "Base build to lock-up (est.)", amount: 274000, line_kind: "lump_sum" },
      { category: "kitchen", label: "Kitchen package (est.)", amount: 22000, line_kind: "lump_sum" },
      { category: "bathroom", label: "Bathroom package (est.)", amount: 24000, line_kind: "lump_sum" },
      { category: "electrical", label: "Split-system AC (2 units) (est.)", amount: 14000, line_kind: "lump_sum" },
      { category: "external", label: "Driveway allowance (est.)", amount: 16000, line_kind: "allowance" },
      { category: "contingency", label: "Contingency (est.)", amount: 18000, line_kind: "allowance" },
      { category: "ps", label: "Provisional sums (est.)", amount: 0, line_kind: "ps" },
    ],
    inclusion_items: [
      { category: "kitchen", item: "Engineered stone", detail: "20mm", included: true },
      { category: "electrical", item: "Split-system AC", detail: "Living + main bedroom", included: true },
      { category: "external", item: "Double garage", detail: "Colorbond", included: true },
      { category: "external", item: "Granny flat / studio", detail: "Not included", included: false },
      { category: "warranty", item: "Extra structural warranty", detail: "Listed extra — NSW statutory floor (6yr major / 2yr other) already applies", included: true },
    ],
  },
];
