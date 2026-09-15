"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LLM_COLLECT_PROMPT } from "@/lib/llm/ingest";

export default function AdminDataPage() {
  const [payload, setPayload] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    setResult(null);
    let json: unknown;
    try {
      json = JSON.parse(payload);
    } catch {
      setError("Paste valid JSON from the LLM.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/llm-ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Ingest failed.");
      return;
    }
    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">LLM data collection</h1>
        <p className="text-muted-foreground">
          Use an LLM to collect licence, Google review, last sale and delay
          facts, then paste the JSON here to update Velu.
        </p>
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="mb-2 text-sm font-medium">Prompt to give the model</p>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs">
          {LLM_COLLECT_PROMPT}
        </pre>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Paste JSON</p>
        <textarea
          rows={12}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          className="flex w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-sm"
          placeholder='{"kind":"builder","company_name":"Dhursan Homes Pty Ltd",...}'
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {result ? (
        <pre className="rounded-lg bg-muted/40 p-3 text-xs">{result}</pre>
      ) : null}

      <Button onClick={() => void submit()} disabled={loading || !payload.trim()}>
        {loading ? "Saving…" : "Ingest into Velu"}
      </Button>
    </div>
  );
}
