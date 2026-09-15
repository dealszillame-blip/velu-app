"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LLM_COLLECT_PROMPT } from "@/lib/llm/ingest";

export default function AdminDataPage() {
  const [payload, setPayload] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registerCount, setRegisterCount] = useState<number | null>(null);
  const [currentCount, setCurrentCount] = useState<number | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [lastLicenceCheck, setLastLicenceCheck] = useState<string | null>(null);
  const [lastGoogleSync, setLastGoogleSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  function applyStats(data: {
    count?: number;
    current_count?: number;
    google_places_configured?: boolean;
    last_licence_check_at?: string | null;
    last_google_sync_at?: string | null;
  }) {
    setRegisterCount(data.count ?? 0);
    setCurrentCount(
      typeof data.current_count === "number" ? data.current_count : null
    );
    setGoogleReady(Boolean(data.google_places_configured));
    setLastLicenceCheck(data.last_licence_check_at ?? null);
    setLastGoogleSync(data.last_google_sync_at ?? null);
  }

  async function loadStats() {
    const res = await fetch("/api/admin/nsw-builders");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    applyStats(data);
  }

  useEffect(() => {
    fetch("/api/admin/nsw-builders")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) applyStats(data);
      })
      .catch(() => undefined);
  }, []);

  async function syncRegister(
    source: "snapshot" | "live" | "google" | "weekly"
  ) {
    setSyncing(source);
    setError(null);
    setResult(null);
    const res = await fetch("/api/admin/nsw-builders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source }),
    });
    const data = await res.json().catch(() => ({}));
    setSyncing(null);
    if (!res.ok) {
      setError(data.error ?? "Register sync failed.");
      return;
    }
    setResult(JSON.stringify(data, null, 2));
    await loadStats().catch(() => undefined);
  }

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Builder data</h1>
        <p className="text-muted-foreground">
          Load NSW Fair Trading contractor-builder licences for Sydney, then
          match Google ratings. These are register records, not onboarded Velu
          accounts.
        </p>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm font-medium">NSW public register</p>
        <p className="text-sm text-muted-foreground">
          {registerCount == null
            ? "Checking directory…"
            : `${registerCount.toLocaleString()} licensed builders in the directory${
                currentCount != null
                  ? ` (${currentCount.toLocaleString()} current)`
                  : ""
              }.`}{" "}
          Google Places is {googleReady ? "configured" : "not configured — add GOOGLE_PLACES_API_KEY"}.
        </p>
        <p className="text-sm text-muted-foreground">
          A Sunday job rechecks licences on Verify NSW and refreshes Google
          reviews (Vercel Cron at 20:00 UTC plus GitHub Action). Nearby only
          shows licences still marked Current.
        </p>
        <p className="text-sm text-muted-foreground">
          Last licence check:{" "}
          {lastLicenceCheck
            ? new Date(lastLicenceCheck).toLocaleString()
            : "not yet"}
          . Last Google review sync:{" "}
          {lastGoogleSync ? new Date(lastGoogleSync).toLocaleString() : "not yet"}
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={Boolean(syncing)}
            onClick={() => void syncRegister("snapshot")}
          >
            {syncing === "snapshot" ? "Importing…" : "Import Sydney snapshot"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(syncing)}
            onClick={() => void syncRegister("live")}
          >
            {syncing === "live" ? "Refreshing…" : "Refresh from Verify NSW"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(syncing) || !googleReady}
            onClick={() => void syncRegister("google")}
          >
            {syncing === "google" ? "Matching…" : "Match Google reviews"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(syncing)}
            onClick={() => void syncRegister("weekly")}
          >
            {syncing === "weekly" ? "Updating…" : "Run weekly update now"}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">LLM ingest</h2>
        <p className="text-muted-foreground">
          Use an LLM to collect last-sale and delay facts for a named builder,
          then paste the JSON here.
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
