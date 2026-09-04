export type PublishedPackage = {
  id?: string;
  key?: string | null;
  builder_id?: string | null;
  builder_name?: string | null;
  storeys: "single" | "double";
  name: string;
  description: string;
  bedrooms: number | null;
  bathrooms: number | null;
  living_area_sqm: number | null;
  indicative_price: number | null;
  source_name: string | null;
  source_url: string | null;
  sort_order: number;
};

export const DEFAULT_PUBLISHED_PACKAGES: PublishedPackage[] = [
  {
    key: "single_family",
    storeys: "single",
    name: "Single-storey family home",
    description:
      "Typical single-level package advertised by volume builders: open-plan living, three-way bathroom, double garage.",
    bedrooms: 4,
    bathrooms: 2,
    living_area_sqm: 185,
    indicative_price: 420000,
    source_name: "Typical published range",
    source_url: null,
    sort_order: 10,
  },
  {
    key: "single_granny",
    storeys: "single",
    name: "Single-storey + granny flat",
    description:
      "Ground-floor living with a self-contained studio or granny flat at the rear.",
    bedrooms: 4,
    bathrooms: 3,
    living_area_sqm: 210,
    indicative_price: 495000,
    source_name: "Typical published range",
    source_url: null,
    sort_order: 20,
  },
  {
    key: "double_family",
    storeys: "double",
    name: "Double-storey family home",
    description:
      "Two-storey package with upstairs bedrooms and downstairs living — the most common published double-storey design.",
    bedrooms: 4,
    bathrooms: 2.5,
    living_area_sqm: 240,
    indicative_price: 545000,
    source_name: "Typical published range",
    source_url: null,
    sort_order: 30,
  },
  {
    key: "double_five_bed",
    storeys: "double",
    name: "Double-storey 5-bed",
    description:
      "Larger two-storey design with five bedrooms and dual living — typical of premium published ranges.",
    bedrooms: 5,
    bathrooms: 3,
    living_area_sqm: 280,
    indicative_price: 625000,
    source_name: "Typical published range",
    source_url: null,
    sort_order: 40,
  },
];

/**
 * TODO: Ingest single/double-storey packages from a builder's own public
 * design catalogue after they opt in (API or sitemap they publish).
 * Do not scrape third-party sites without permission.
 * Currently returns null so the UI uses the data-driven catalogue.
 */
export function ingestBuilderPublishedPackages(_sourceUrl: string): PublishedPackage[] | null {
  void _sourceUrl;
  return null;
}
