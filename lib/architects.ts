export type ArchitectDirectoryItem = {
  key: string;
  name: string;
  description: string;
  specialty: string | null;
  service_area: string | null;
  website_url: string | null;
  sort_order: number;
};

export type ArchitectRequest = {
  id: string;
  architect_key: string;
  architect_name: string;
  status: string;
  buyer_notes: string | null;
  created_at: string;
};

export const DEFAULT_ARCHITECTS: ArchitectDirectoryItem[] = [
  {
    key: "custom_home_architect",
    name: "Custom home architect",
    description:
      "Site-specific floor plans and DA-ready drawings for irregular or sloping lots.",
    specialty: "Custom new homes",
    service_area: "South West Sydney",
    website_url: null,
    sort_order: 10,
  },
  {
    key: "dual_occ_designer",
    name: "Dual occupancy designer",
    description:
      "Knockdown-rebuild and dual-occupancy layouts that maximise yield on suburban blocks.",
    specialty: "Dual occupancy",
    service_area: "South West Sydney",
    website_url: null,
    sort_order: 20,
  },
  {
    key: "interior_spatial",
    name: "Interior & spatial designer",
    description:
      "Kitchen, bathroom and living layouts once the builder package is selected.",
    specialty: "Interiors",
    service_area: "Greater Sydney",
    website_url: null,
    sort_order: 30,
  },
];
