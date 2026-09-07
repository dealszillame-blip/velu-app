"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatProposalPrice } from "@/lib/proposals";
import type { RecommendationReport } from "@/lib/proposal-recommendation";
import { cn } from "@/lib/utils";

export function AiRecommendationPanel({
  variant = "full",
  onSeeFull,
  onLoadDemo,
  demoLoading = false,
}: {
  variant?: "full" | "compact";
  onSeeFull?: () => void;
  onLoadDemo?: () => void;
  demoLoading?: boolean;
}) {
  const [report, setReport] = useState<RecommendationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/buyer/recommendation")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Failed to rank packages.");
        setReport(data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    if (variant === "compact") return null;
    return (
      <p className="py-6 text-sm text-muted-foreground">
        Ranking packages against your brief…
      </p>
    );
  }

  if (error) {
    if (variant === "compact") return null;
    return (
      <p className="py-6 text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (!report?.recommended) {
    if (variant === "compact") return null;
    return (
      <div className="rounded-xl border border-border p-5">
        <p className="font-medium">No packages to recommend yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Load demonstration packages or wait for builders to submit, then
          return here for a ranked pick.
        </p>
        {onLoadDemo ? (
          <Button
            className="mt-4 rounded-full"
            onClick={onLoadDemo}
            disabled={demoLoading}
          >
            {demoLoading ? "Loading demo packages…" : "Load demonstration packages"}
          </Button>
        ) : null}
      </div>
    );
  }

  const pick = report.recommended;

  if (variant === "compact") {
    return (
      <div className="mb-6 rounded-2xl border border-border bg-foreground p-5 text-background">
        <p className="label-caps mb-2 text-[color:rgba(255,255,255,0.55)]">
          <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
          Velu recommendation
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">
              {pick.builder_name}
            </h3>
            <p className="mt-1 text-sm text-white/70">{pick.package_name}</p>
            <p className="mt-2 max-w-xl text-sm text-white/65">{report.summary}</p>
          </div>
          <div className="flex items-end gap-4">
            <p className="text-3xl font-semibold tabular-nums">{pick.score}</p>
            {onSeeFull ? (
              <Button
                variant="secondary"
                className="rounded-full"
                onClick={onSeeFull}
              >
                See ranking
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-foreground p-6 text-background">
        <p className="label-caps mb-3 text-[color:rgba(255,255,255,0.55)]">
          <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
          Velu recommendation
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          {pick.builder_name}
        </h2>
        <p className="mt-1 text-sm text-white/70">{pick.package_name}</p>
        <div className="mt-4 flex flex-wrap items-end gap-6">
          <div>
            <p className="label-caps text-[color:rgba(255,255,255,0.45)]">Fit</p>
            <p className="text-3xl font-semibold tabular-nums">{pick.score}/100</p>
          </div>
          <div>
            <p className="label-caps text-[color:rgba(255,255,255,0.45)]">Price</p>
            <p className="text-xl font-medium">{formatProposalPrice(pick.base_price)}</p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
          {report.summary}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <p className="mb-2 text-sm font-medium">Why this one</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {pick.strengths.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="mb-2 text-sm font-medium">Watch-outs</p>
          {pick.gaps.length ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {pick.gaps.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No material gaps against your saved brief.
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="label-caps mb-3">Ranked packages</p>
        <div className="space-y-2">
          {report.ranked.map((row, index) => (
            <div
              key={row.proposal_id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
                index === 0 ? "border-foreground" : "border-border"
              )}
            >
              <div>
                <p className="font-medium">
                  {index + 1}. {row.builder_name}
                </p>
                <p className="text-sm text-muted-foreground">{row.package_name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{row.headline}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold tabular-nums">{row.score}</p>
                <p className="text-sm text-muted-foreground">
                  {formatProposalPrice(row.base_price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-muted/40 p-4">
        <p className="mb-2 text-sm font-medium">Suggested next steps</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {report.next_steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
