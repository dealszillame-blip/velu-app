import type {
  HomeSpecs,
  InclusionItem,
  PriceBreakdownLine,
} from "@/lib/proposal-breakdown";

export type DemoProposalTemplate = {
  key: string;
  package_name: string;
  base_price: number;
  estimated_build_weeks: number;
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
    inclusions:
      "Granny-flat studio, stone benchtops, ducted AC, double garage, 10-year warranty",
    notes:
      "Demonstration package. Ground-floor living with a rear granny-flat studio. Site costs included for South West Sydney lots.",
    home_specs: {
      bedrooms: 4,
      bathrooms: 3,
      car_spaces: 2,
      living_area_sqm: 198,
      storeys: 1,
    },
    price_breakdown: [
      { category: "site", label: "Site costs & connections", amount: 42000 },
      { category: "base", label: "Base build to lock-up", amount: 268000 },
      { category: "kitchen", label: "Kitchen package", amount: 28000 },
      { category: "bathroom", label: "Bathroom + ensuite", amount: 32000 },
      { category: "electrical", label: "Electrical & ducted AC", amount: 26000 },
      { category: "external", label: "Granny flat studio fit-out", amount: 62000 },
      { category: "driveway", label: "Driveway & paths", amount: 18000 },
      { category: "contingency", label: "Contingency allowance", amount: 22000 },
    ],
    inclusion_items: [
      { category: "kitchen", item: "Stone benchtops", detail: "40mm engineered stone", included: true },
      { category: "electrical", item: "Ducted air conditioning", detail: "2 zones", included: true },
      { category: "external", item: "Granny flat / studio", detail: "Self-contained rear studio", included: true },
      { category: "external", item: "Double garage", detail: "Remote doors", included: true },
      { category: "warranty", item: "Structural warranty", detail: "10 years", included: true },
    ],
  },
  {
    key: "family_five_premium",
    package_name: "Hawkesbury 25 Dual Living",
    base_price: 548000,
    estimated_build_weeks: 33,
    inclusions:
      "5-bed single storey, granny flat, stone, ducted AC, solar-ready, landscaping",
    notes:
      "Demonstration package. Closest match to a 5-bed + granny-flat brief. Fixed site costs for R2 estate lots.",
    home_specs: {
      bedrooms: 5,
      bathrooms: 3,
      car_spaces: 2,
      living_area_sqm: 246,
      storeys: 1,
    },
    price_breakdown: [
      { category: "site", label: "Site costs & connections", amount: 48000 },
      { category: "base", label: "Base build to lock-up", amount: 292000 },
      { category: "kitchen", label: "Kitchen package", amount: 34000 },
      { category: "bathroom", label: "3-way bathroom package", amount: 38000 },
      { category: "electrical", label: "Electrical & ducted AC", amount: 28000 },
      { category: "external", label: "Granny flat + landscaping", amount: 72000 },
      { category: "energy", label: "Solar-ready upgrade", amount: 12000 },
      { category: "contingency", label: "Contingency allowance", amount: 24000 },
    ],
    inclusion_items: [
      { category: "kitchen", item: "Stone benchtops", detail: "40mm stone + butler's pantry", included: true },
      { category: "electrical", item: "Ducted air conditioning", detail: "3 zones", included: true },
      { category: "external", item: "Granny flat / studio", detail: "1-bed self-contained", included: true },
      { category: "energy", item: "Solar ready", detail: "Inverter wiring included", included: true },
      { category: "external", item: "Alfresco", detail: "Tiled outdoor living", included: true },
      { category: "warranty", item: "Structural warranty", detail: "10 years + 2-year defects", included: true },
    ],
  },
  {
    key: "double_storey_value",
    package_name: "The Campbell 220",
    base_price: 468000,
    estimated_build_weeks: 26,
    inclusions: "Engineered stone, split-system AC, Colorbond roof, double garage",
    notes:
      "Demonstration package. Fastest programme and lowest lump sum. No granny flat and no ducted AC.",
    home_specs: {
      bedrooms: 4,
      bathrooms: 2,
      car_spaces: 2,
      living_area_sqm: 186,
      storeys: 2,
    },
    price_breakdown: [
      { category: "site", label: "Site costs & connections", amount: 36000 },
      { category: "base", label: "Base build to lock-up", amount: 274000 },
      { category: "kitchen", label: "Kitchen package", amount: 22000 },
      { category: "bathroom", label: "Bathroom package", amount: 24000 },
      { category: "electrical", label: "Split-system AC (2 units)", amount: 14000 },
      { category: "external", label: "Driveway allowance", amount: 16000 },
      { category: "contingency", label: "Contingency allowance", amount: 18000 },
    ],
    inclusion_items: [
      { category: "kitchen", item: "Engineered stone", detail: "20mm", included: true },
      { category: "electrical", item: "Split-system AC", detail: "Living + main bedroom", included: true },
      { category: "external", item: "Double garage", detail: "Colorbond", included: true },
      { category: "external", item: "Granny flat / studio", detail: "Not included", included: false },
      { category: "warranty", item: "Structural warranty", detail: "6 years", included: true },
    ],
  },
];
