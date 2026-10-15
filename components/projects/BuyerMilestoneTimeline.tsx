"use client";

import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StartInquiryButton } from "@/components/messages/StartInquiryButton";
import { StagePaymentDetails } from "@/components/projects/StagePaymentDetails";
import { buyerMilestoneFocus } from "@/lib/milestones";
import type { BuilderPaymentDetails } from "@/lib/payment-details";
import {
  MILESTONE_LABELS,
  MILESTONE_SUMMARIES,
  type ConstructionMilestone,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type BuyerMilestoneTimelineProps = {
  stage: ConstructionMilestone;
  builderName: string;
  buyerName: string;
  statusHref: string;
  messagesPath: string;
  landListingId?: string | null;
  counterpartyId?: string | null;
  paymentDetails?: BuilderPaymentDetails | null;
};

export function BuyerMilestoneTimeline({
  stage,
  builderName,
  buyerName,
  statusHref,
  messagesPath,
  landListingId,
  counterpartyId,
  paymentDetails = null,
}: BuyerMilestoneTimelineProps) {
  const focus = buyerMilestoneFocus(stage);

  if (focus.complete) {
    return (
      <div className="space-y-6">
        <FinishedBuild builder={builderName} buyer={buyerName} />
        <DoneTrail stages={focus.done} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {focus.done.length > 0 && <DoneTrail stages={focus.done} />}

      {focus.current && (
        <Card aria-current="step">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>
                <h2 className="text-lg font-semibold tracking-tight">
                  {MILESTONE_LABELS[focus.current]}
                </h2>
              </CardTitle>
              <Badge className="rounded-full">Current</Badge>
            </div>
            <CardDescription className="text-sm leading-relaxed">
              {MILESTONE_SUMMARIES[focus.current]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StagePaymentDetails details={paymentDetails} />
            <p className="text-sm text-muted-foreground">
              This is the open stage. You can view the payment details{" "}
              {builderName} supplied and message the builder. You cannot mark this
              stage paid, and you cannot move the build forward.
            </p>
          </CardContent>
          <CardFooter className="flex-wrap gap-2">
            {statusHref ? (
              <Link
                href={statusHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-full"
                )}
              >
                View status
              </Link>
            ) : null}
            <MessageBuilder
              messagesPath={messagesPath}
              landListingId={landListingId}
              counterpartyId={counterpartyId}
            />
          </CardFooter>
        </Card>
      )}

      {focus.next && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          <span className="font-medium text-foreground">
            {MILESTONE_LABELS[focus.next]}
          </span>
          <span>Unlocks when the builder confirms payment for the current stage.</span>
        </p>
      )}

      {focus.laterCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {focus.laterCount} later {focus.laterCount === 1 ? "stage" : "stages"}
        </p>
      )}
    </div>
  );
}

export function FinishedBuild({
  builder,
  buyer,
}: {
  builder: string;
  buyer: string;
}) {
  return (
    <div className="rounded-2xl bg-foreground px-5 py-5 text-background sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-background/70">
        Finished
      </p>
      <p className="mt-2 text-xl font-semibold tracking-tight">Build complete</p>
      <p className="mt-2 max-w-xl text-sm text-background/80">
        {builder} has handed this home to {buyer}. Every stage from Contract
        through Handover is done. This page stays on the finished build.
        Handover is the last stage.
      </p>
    </div>
  );
}

export function DoneTrail({
  stages,
}: {
  stages: readonly ConstructionMilestone[];
}) {
  return (
    <ol className="space-y-2" aria-label="Completed stages">
      {stages.map((milestone) => (
        <li key={milestone} className="flex items-center gap-2 text-sm">
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
            aria-hidden
          >
            <Check className="size-3" strokeWidth={2.5} />
          </span>
          <span className="font-medium">{MILESTONE_LABELS[milestone]}</span>
          <span className="text-muted-foreground">Done</span>
        </li>
      ))}
    </ol>
  );
}

function MessageBuilder({
  messagesPath,
  landListingId,
  counterpartyId,
}: {
  messagesPath: string;
  landListingId?: string | null;
  counterpartyId?: string | null;
}) {
  if (landListingId && counterpartyId) {
    return (
      <StartInquiryButton
        landListingId={landListingId}
        counterpartyId={counterpartyId}
        messagesPath={messagesPath}
        label="Message the builder"
        variant="outline"
      />
    );
  }

  return (
    <Link
      href={messagesPath}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "rounded-full"
      )}
    >
      Message the builder
    </Link>
  );
}
