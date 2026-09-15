export const BUILDER_TYPE_OPTIONS = [
  { value: "bulk", label: "Bulk builder" },
  { value: "semi_custom", label: "Semi-custom" },
  { value: "custom", label: "Custom" },
  { value: "designer", label: "Designer" },
] as const;

export type BuilderType = (typeof BUILDER_TYPE_OPTIONS)[number]["value"];

export function builderTypeLabel(value?: string | null): string {
  if (!value) return "Builder";
  return BUILDER_TYPE_OPTIONS.find((opt) => opt.value === value)?.label ?? value;
}

export const NSW_LICENCE_VERIFY_SEARCH =
  "https://verify.licence.nsw.gov.au/results?searchTerm=";
