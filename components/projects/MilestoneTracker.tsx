"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuilderPaymentDetailsForm } from "@/components/builder/BuilderPaymentDetailsForm";
import { BuyerMilestoneTimeline } from "@/components/projects/BuyerMilestoneTimeline";
import {
  CONSTRUCTION_STAGES,
  MILESTONE_LABELS,
  MILESTONE_SUMMARIES,
  type ConstructionMilestone,
} from "@/lib/types";
import {
  isBuildComplete,
  milestoneVisualState,
  nextMilestone,
} from "@/lib/milestones";
import {
  clientSafeMessage,
  type BuilderPaymentDetails,
} from "@/lib/payment-details";
import { cn } from "@/lib/utils";

function displayedStage(
  currentStage: ConstructionMilestone,
  advancedTo: ConstructionMilestone | null
): ConstructionMilestone {
  if (!advancedTo) return currentStage;
  const incoming = CONSTRUCTION_STAGES.indexOf(currentStage);
  const held = CONSTRUCTION_STAGES.indexOf(advancedTo);
  if (incoming < 0) return advancedTo;
  return incoming >= held ? currentStage : advancedTo;
}

const STATE_LABEL = {
  done: "Done",
  current: "Current",
  upcoming: "Upcoming",
} as const;

type MilestoneTrackerProps = {
  projectId: string;
  currentStage: ConstructionMilestone;
  canAdvance?: boolean;
  /** Compact stepper on the project page. Timeline is the full milestone page. */
  variant?: "compact" | "timeline";
  /** Buyer sees the focused timeline. Builder sees every stage. */
  audience?: "buyer" | "builder";
  builderName?: string | null;
  buyerName?: string | null;
  statusHref?: string;
  messagesPath?: string;
  landListingId?: string | null;
  counterpartyId?: string | null;
  paymentDetails?: BuilderPaymentDetails | null;
};

export function MilestoneTracker({
  projectId,
  currentStage,
  canAdvance = false,
  variant = "compact",
  audience = "builder",
  builderName = null,
  buyerName = null,
  statusHref,
  messagesPath = "/buyer/messages",
  landListingId = null,
  counterpartyId = null,
  paymentDetails = null,
}: MilestoneTrackerProps) {
  const router = useRouter();
  const pending = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedTo, setAdvancedTo] = useState<ConstructionMilestone | null>(null);
  const stage = displayedStage(currentStage, advancedTo);

  const complete = isBuildComplete(stage);
  const upcoming = nextMilestone(stage);
  const builder = builderName ?? "the builder on this project";
  const buyer = buyerName ?? "the buyer on this project";

  async function confirmPayment() {
    const target = nextMilestone(stage);
    if (pending.current || !target) return;

    pending.current = true;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/projects/${projectId}/milestone`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm_payment: true }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      pending.current = false;
      setLoading(false);
      setError(
        clientSafeMessage(data.error, "Could not confirm the payment you received.")
      );
      return;
    }

    const saved = CONSTRUCTION_STAGES.find((item) => item === data.stage) ?? target;
    setAdvancedTo(saved);
    pending.current = false;
    setLoading(false);
    router.refresh();
  }

  if (variant === "timeline" && (audience === "buyer" || complete)) {
    return (
      <BuyerMilestoneTimeline
        stage={stage}
        builderName={builder}
        buyerName={buyer}
        statusHref={statusHref ?? ""}
        messagesPath={messagesPath}
        landListingId={landListingId}
        counterpartyId={counterpartyId}
        paymentDetails={complete ? null : paymentDetails}
      />
    );
  }

  const confirmOnCurrent =
    variant === "timeline" && canAdvance && upcoming !== null;
  const nextLabel = upcoming ? MILESTONE_LABELS[upcoming] : null;

  return (
    <div className="space-y-8">
      {variant === "timeline" ? (
        <ol className="space-y-0">
          {CONSTRUCTION_STAGES.map((milestone, index) => {
            const state = milestoneVisualState(milestone, stage);
            const last = index === CONSTRUCTION_STAGES.length - 1;
            return (
              <li
                key={milestone}
                className="flex gap-4"
                aria-current={state === "current" ? "step" : undefined}
              >
                <div className="flex h-full flex-col items-center">
                  <span
                    className={cn(
                      "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      state === "done" && "bg-foreground text-background",
                      state === "current" &&
                        "bg-foreground text-background ring-4 ring-foreground/10",
                      state === "upcoming" && "bg-muted text-muted-foreground"
                    )}
                    aria-hidden
                  >
                    {state === "done" ? (
                      <Check className="size-4" strokeWidth={2.5} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  {!last && (
                    <span
                      className={cn(
                        "my-1 w-px flex-1",
                        state === "done" ? "bg-foreground/30" : "bg-border"
                      )}
                    />
                  )}
                </div>
                <div className={cn("min-w-0 flex-1", !last && "pb-6")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      className={cn(
                        "font-medium tracking-tight",
                        state === "upcoming" && "text-muted-foreground"
                      )}
                    >
                      {MILESTONE_LABELS[milestone]}
                    </p>
                    <Badge
                      variant={
                        state === "upcoming"
                          ? "secondary"
                          : state === "current"
                            ? "default"
                            : "outline"
                      }
                      className="rounded-full"
                    >
                      {STATE_LABEL[state]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {MILESTONE_SUMMARIES[milestone]}
                  </p>
                  {state === "current" && confirmOnCurrent && nextLabel && (
                    <div className="mt-3 flex flex-col items-start gap-3">
                      <BuilderPaymentDetailsForm
                        initial={paymentDetails}
                        variant="embedded"
                      />
                      <Button
                        type="button"
                        onClick={confirmPayment}
                        disabled={loading}
                        className="h-12 rounded-full px-8"
                      >
                        {loading ? "Confirming…" : "Confirm payment received"}
                      </Button>
                      <p className="max-w-xl text-sm text-muted-foreground">
                        This records that you received payment for{" "}
                        {MILESTONE_LABELS[stage]}. The build then moves to {nextLabel}.
                        Velu does not transfer the money.
                      </p>
                      {error && (
                        <p className="text-sm text-destructive" role="alert">
                          {error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="overflow-x-auto">
          <div className="relative min-w-[52rem] lg:min-w-0">
            <div className="absolute left-0 right-0 top-5 h-px bg-black/[0.08]" />
            <ol className="grid grid-cols-9 gap-2">
            {CONSTRUCTION_STAGES.map((milestone, index) => {
              const state = milestoneVisualState(milestone, stage);
              return (
                <li
                  key={milestone}
                  className="relative flex flex-col items-center text-center"
                >
                  <span
                    className={cn(
                      "relative z-10 flex size-10 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      state === "done" && "bg-foreground text-background",
                      state === "current" &&
                        "bg-foreground text-background ring-4 ring-foreground/10",
                      state === "upcoming" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {state === "done" ? (
                      <Check className="size-4" strokeWidth={2.5} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <p
                    className={cn(
                      "mt-3 text-xs font-medium",
                      state === "current" ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {MILESTONE_LABELS[milestone]}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {STATE_LABEL[state]}
                  </p>
                </li>
              );
            })}
            </ol>
          </div>
        </div>
      )}

      {variant === "timeline" && !complete && (
        <div className="rounded-xl bg-muted px-4 py-3 text-sm">
          <p>
            Current stage is {MILESTONE_LABELS[stage]}. Confirm you received
            payment for this stage
            {upcoming ? ` to move it to ${MILESTONE_LABELS[upcoming]}` : ""}. Velu
            does not transfer the money. {buyer} can view the details you supplied
            and cannot confirm payment or move a stage.
          </p>
        </div>
      )}

      {complete && variant === "compact" && (
        <p className="text-sm text-muted-foreground">
          Build complete. All nine stages are done, including Handover.
        </p>
      )}

    </div>
  );
}
