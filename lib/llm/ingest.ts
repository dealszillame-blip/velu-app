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

export const TENDER_NARRATOR =
  "You compare NSW house packages against stored past tenders. Be factual. Three short sentences max.";

export const RECOMMEND_NARRATOR =
  "You write a short NSW home-buyer recommendation from a ranked brief-fit list. Be factual. Do not invent prices, inclusions, or scores. Three short sentences max. Keep the numbered brief-fit score as given. Storeys (single-storey vs Ground + 1 / two-storey) and granny-flat are hard layout constraints: never recommend a single-storey home when the brief is G+1 or two-storey. If the listed pick still mismatches layout, say no package matches the layout and name a storey-matching runner-up.";

export function geminiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    null
  );
}

export function llmKeysConfigured() {
  return {
    gemini: Boolean(geminiKey()),
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
  };
}

export type LlmNarrationResult = {
  text: string | null;
  provider: "gemini" | "openai" | null;
  error: string | null;
};

function geminiModels(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const fallbacks = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
  ];
  return [...new Set(preferred ? [preferred, ...fallbacks] : fallbacks)];
}

function extractGeminiText(json: {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}): string | null {
  const text = json.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("")
    .trim();
  return text || null;
}

function geminiErrorMessage(status: number, raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed.error?.message) {
      return `Gemini ${status}: ${parsed.error.message}`.slice(0, 280);
    }
  } catch {
    /* ignore */
  }
  return `Gemini ${status}`.slice(0, 280);
}

async function geminiGenerate(
  prompt: string,
  model: string,
  disableThinking: boolean,
  systemInstruction: string
): Promise<{ text: string | null; error: string | null; retryWithoutThinking?: boolean }> {
  const key = geminiKey();
  if (!key) {
    return { text: null, error: "GEMINI_API_KEY is not set on this server." };
  }

  const generationConfig: Record<string, unknown> = {
    temperature: 0.2,
    maxOutputTokens: 1024,
  };
  if (disableThinking) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      }),
    }
  );

  const raw = await res.text();
  if (!res.ok) {
    const error = geminiErrorMessage(res.status, raw);
    const retryWithoutThinking = disableThinking && res.status === 400;
    return { text: null, error, retryWithoutThinking };
  }

  let json: { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  try {
    json = JSON.parse(raw) as typeof json;
  } catch {
    return { text: null, error: `Gemini ${model}: invalid JSON response` };
  }

  const text = extractGeminiText(json);
  if (!text) {
    return {
      text: null,
      error: `Gemini ${model} returned no text (often thinking used the token budget).`,
    };
  }
  return { text, error: null };
}

async function narrateWithGemini(
  prompt: string,
  systemInstruction: string
): Promise<LlmNarrationResult> {
  if (!geminiKey()) {
    return { text: null, provider: null, error: "GEMINI_API_KEY is not set on this server." };
  }

  let lastError: string | null = null;
  for (const model of geminiModels()) {
    let disableThinking = true;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = await geminiGenerate(prompt, model, disableThinking, systemInstruction);
      if (result.text) {
        return { text: result.text, provider: "gemini", error: null };
      }
      lastError = result.error;
      if (result.retryWithoutThinking) {
        disableThinking = false;
        continue;
      }
      break;
    }
  }

  return { text: null, provider: null, error: lastError };
}

async function narrateWithOpenAi(
  prompt: string,
  systemInstruction: string
): Promise<LlmNarrationResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return { text: null, provider: null, error: null };
  }

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
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    return { text: null, provider: null, error: `OpenAI ${res.status}` };
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content?.trim() || null;
  return {
    text,
    provider: text ? "openai" : null,
    error: text ? null : "OpenAI returned no text",
  };
}

export async function probeGemini(): Promise<{
  configured: boolean;
  ok: boolean;
  model: string | null;
  error: string | null;
}> {
  const configured = Boolean(geminiKey());
  if (!configured) {
    return {
      configured: false,
      ok: false,
      model: null,
      error:
        "GEMINI_API_KEY is not in this deployment. In Vercel, set it for Production and Redeploy.",
    };
  }

  const result = await narrateWithGemini("Reply with the single word OK.", TENDER_NARRATOR);
  return {
    configured: true,
    ok: Boolean(result.text),
    model: geminiModels()[0] ?? null,
    error: result.error,
  };
}

/** Gemini first when GEMINI_API_KEY is set, then OpenAI. Failures fall back to the deterministic summary. */
export async function maybeNarrateWithLlm(
  prompt: string,
  options?: { systemInstruction?: string }
): Promise<LlmNarrationResult> {
  const systemInstruction = options?.systemInstruction ?? TENDER_NARRATOR;
  try {
    if (geminiKey()) {
      const gemini = await narrateWithGemini(prompt, systemInstruction);
      if (gemini.text) return gemini;
      const openai = await narrateWithOpenAi(prompt, systemInstruction);
      if (openai.text) return openai;
      return gemini.error ? gemini : openai;
    }
    return await narrateWithOpenAi(prompt, systemInstruction);
  } catch (error) {
    const message = error instanceof Error ? error.message : "LLM request failed";
    return { text: null, provider: null, error: message };
  }
}
