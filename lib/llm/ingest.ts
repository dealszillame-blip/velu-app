import { z } from "zod";

/**
 * Structured payload an LLM (or a person) should return so Velu can
 * collect and update builder / tender records without free-form dumps.
 */
export const llmBuilderIngestSchema = z.object({
  kind: z.literal("builder"),
  company_name: z.string().min(2),
  license_number: z.string().min(3).optional(),
  license_verify_url: z.string().url().optional(),
  is_license_valid: z.boolean().optional(),
  google_rating: z.number().min(0).max(5).optional(),
  google_review_count: z.number().int().min(0).optional(),
  builder_type: z.enum(["bulk", "semi_custom", "custom", "designer"]).optional(),
  last_property_sold_address: z.string().optional(),
  last_property_sold_at: z.string().optional(),
  avg_delay_weeks: z.number().min(0).optional(),
  headline: z.string().max(280).optional(),
  website_url: z.string().url().optional(),
  anchor_address: z.string().optional(),
  service_radius_km: z.number().int().min(5).max(120).optional(),
  notices: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
        severity: z.enum(["info", "warning", "action"]).default("info"),
        issued_at: z.string().optional(),
      })
    )
    .optional(),
});

export const llmTenderIngestSchema = z.object({
  kind: z.literal("tender"),
  key: z.string().min(3).max(80),
  package_name: z.string().min(2),
  region: z.string().default("south_west_sydney"),
  builder_type: z.enum(["bulk", "semi_custom", "custom", "designer"]).optional(),
  construction_grade: z.enum(["ground", "medium", "luxury"]).optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().optional(),
  storeys: z.number().int().optional(),
  living_area_sqm: z.number().optional(),
  base_price: z.number().positive(),
  estimated_build_weeks: z.number().int().optional(),
  inclusions: z.string().optional(),
  notes: z.string().optional(),
  source_name: z.string().optional(),
});

export const llmIngestSchema = z.discriminatedUnion("kind", [
  llmBuilderIngestSchema,
  llmTenderIngestSchema,
]);

export type LlmIngestPayload = z.infer<typeof llmIngestSchema>;

export const LLM_COLLECT_PROMPT = `You extract NSW residential-builder facts for Velu.
Return JSON only. Use one of these shapes:

{"kind":"builder","company_name":"...","license_number":"...","license_verify_url":"https://verify.licence.nsw.gov.au/results?searchTerm=...","is_license_valid":true,"google_rating":4.8,"google_review_count":85,"builder_type":"bulk","last_property_sold_address":"...","last_property_sold_at":"2026-08-01","avg_delay_weeks":0,"headline":"...","website_url":"https://...","anchor_address":"...","service_radius_km":40,"notices":[{"title":"...","body":"...","severity":"warning"}]}

{"kind":"tender","key":"sws-volume-4bed-2026","package_name":"...","region":"south_west_sydney","builder_type":"bulk","construction_grade":"ground","bedrooms":4,"bathrooms":2,"storeys":1,"living_area_sqm":186,"base_price":465000,"estimated_build_weeks":28,"inclusions":"...","notes":"...","source_name":"past tender"}

builder_type must be bulk | semi_custom | custom | designer.
construction_grade must be ground | medium | luxury.
Prefer Verify NSW for licence status. Prefer Google for rating and review count.
If a field is unknown, omit it.`;

export async function maybeNarrateWithLlm(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You compare NSW house packages against stored past tenders. Be factual. Three short sentences max.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() || null;
}
