import { z } from "zod";

export const BUILDER_SPECIALTY_OPTIONS = [
  { value: "new_build", label: "New builds" },
  { value: "knockdown_rebuild", label: "Knock down / rebuild" },
  { value: "refurb", label: "Refurbishment" },
  { value: "granny_flat", label: "Granny flat" },
] as const;

export type BuilderSpecialty = (typeof BUILDER_SPECIALTY_OPTIONS)[number]["value"];

export const builderSpecialtySchema = z.enum([
  "new_build",
  "knockdown_rebuild",
  "refurb",
  "granny_flat",
]);

export const builderPrelaunchSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
  company_name: z.string().max(120).optional(),
  service_area: z.string().min(2).max(500),
  specialties: z.array(builderSpecialtySchema).min(1),
  notes: z.string().max(2000).optional(),
});

export type BuilderPrelaunchInterest = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  service_area: string;
  specialties: BuilderSpecialty[];
  notes: string | null;
  status: "new" | "contacted" | "invited" | "archived";
  created_at: string;
  updated_at: string;
};

export function formatSpecialties(values: string[]): string {
  const labels = new Map(
    BUILDER_SPECIALTY_OPTIONS.map((option) => [option.value, option.label])
  );
  return values.map((value) => labels.get(value as BuilderSpecialty) ?? value).join(", ");
}
