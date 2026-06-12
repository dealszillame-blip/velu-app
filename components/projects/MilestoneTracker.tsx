"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MILESTONE_LABELS, type ConstructionMilestone } from "@/lib/types";
import { cn } from "@/lib/utils";

const STAGES: ConstructionMilestone[] = [
  "contract",
  "slab",
  "frame",
  "lockup",
  "fixing",
  "completion",
];

type MilestoneTrackerProps = {
  projectId: string;
  currentStage: ConstructionMilestone;
  canAdvance?: boolean;
};

export function MilestoneTracker({
  projectId,
  currentStage,
  canAdvance = false,
}: MilestoneTrackerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentIndex = STAGES.indexOf(currentStage);

  async function advanceStage() {
    const next = STAGES[currentIndex + 1];
    if (!next) return;

    setLoading(true);
    setError(null);

    const res = await fetch(`/api/projects/${projectId}/milestone`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: next }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not update milestone");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute left-0 right-0 top-5 hidden h-px bg-black/[0.08] sm:block" />
        <ol className="grid gap-4 sm:grid-cols-6">
          {STAGES.map((stage, index) => {
            const done = index < currentIndex;
            const active = index === currentIndex;

            return (
              <li key={stage} className="relative flex flex-col items-center text-center">
                <span
                  className={cn(
                    "relative z-10 flex size-10 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    done && "bg-foreground text-background",
                    active && "bg-foreground text-background ring-4 ring-foreground/10",
                    !done && !active && "bg-muted text-muted-foreground"
                  )}
                >
                  {index + 1}
                </span>
                <p
                  className={cn(
                    "mt-3 text-xs font-medium",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {MILESTONE_LABELS[stage]}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      {canAdvance && currentIndex < STAGES.length - 1 && (
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button
            onClick={advanceStage}
            disabled={loading}
            className="h-12 rounded-full px-8"
          >
            {loading
              ? "Updating…"
              : `Advance to ${MILESTONE_LABELS[STAGES[currentIndex + 1]]}`}
          </Button>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
