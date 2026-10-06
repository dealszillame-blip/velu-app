export const CONTRACT_TYPES = [
  { value: "fixed_price", label: "Fixed price" },
  { value: "cost_plus", label: "Cost plus" },
  { value: "hybrid", label: "Hybrid" },
] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number]["value"];

export const LINE_KINDS = [
  { value: "lump_sum", label: "Lump sum" },
  { value: "pc", label: "Prime cost (PC)" },
  { value: "ps", label: "Provisional sum (PS)" },
  { value: "allowance", label: "Allowance" },
] as const;

export type LineKind = (typeof LINE_KINDS)[number]["value"];

export function isContractType(value: unknown): value is ContractType {
  return (
    value === "fixed_price" || value === "cost_plus" || value === "hybrid"
  );
}

export function contractTypeLabel(value?: string | null): string {
  if (!value) return "Not stated";
  return CONTRACT_TYPES.find((item) => item.value === value)?.label ?? value;
}

export function lineKindLabel(value?: string | null): string {
  if (!value) return "Lump sum";
  return LINE_KINDS.find((item) => item.value === value)?.label ?? value;
}

export function defaultLineKind(category: string): LineKind {
  if (category === "pc") return "pc";
  if (category === "ps") return "ps";
  if (category === "site" || category === "contingency") return "allowance";
  return "lump_sum";
}
