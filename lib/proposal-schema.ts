import { z } from "zod";

export const breakdownLineSchema = z.object({
  category: z.string(),
  label: z.string().min(1),
  amount: z.number().min(0),
  note: z.string().optional(),
  line_kind: z.enum(["lump_sum", "pc", "ps", "allowance"]).optional(),
  provisional: z.boolean().optional(),
});

export const inclusionItemSchema = z.object({
  category: z.string(),
  item: z.string().min(1),
  detail: z.string(),
  included: z.boolean(),
});

export const homeSpecsSchema = z.object({
  bedrooms: z.number().int().positive().optional(),
  bathrooms: z.number().positive().optional(),
  car_spaces: z.number().int().min(0).optional(),
  living_area_sqm: z.number().positive().optional(),
  storeys: z.number().int().positive().optional(),
});

export const contractTypeSchema = z.enum(["fixed_price", "cost_plus", "hybrid"]);

export const proposalFieldsSchema = z.object({
  package_name: z.string().min(2),
  base_price: z.number().positive(),
  contract_type: contractTypeSchema,
  inclusions: z.string().optional(),
  estimated_build_weeks: z.number().int().positive().optional(),
  notes: z.string().optional(),
  price_breakdown: z.array(breakdownLineSchema).optional(),
  inclusion_items: z.array(inclusionItemSchema).optional(),
  home_specs: homeSpecsSchema.optional(),
});

export const createProposalSchema = proposalFieldsSchema.extend({
  land_listing_id: z.string().uuid(),
});
