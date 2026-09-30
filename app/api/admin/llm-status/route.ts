import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { llmKeysConfigured, probeGemini } from "@/lib/llm/ingest";

export const maxDuration = 30;

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const keys = llmKeysConfigured();
  const gemini = await probeGemini();

  return NextResponse.json({
    gemini_configured: keys.gemini,
    openai_configured: keys.openai,
    gemini_ok: gemini.ok,
    gemini_model: gemini.model,
    gemini_error: gemini.error,
  });
}
