"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Hammer,
  Scale,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LandThumbnail } from "@/components/shared/LandThumbnail";
import { StatStrip } from "@/components/shared/StatStrip";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatProposalPrice,
  proposalStatusLabel,
  type ProposalRow,
} from "@/lib/proposals";

const COMPARE_STEPS = [
  {
    icon: FileText,
    title: "Secure your land",
    description: "Mark a lot as sold once you've exchanged contracts.",
  },
  {
    icon: Hammer,
    title: "Builders submit packages",
    description: "Registered builders in your area send build proposals.",
  },
  {
    icon: Scale,
    title: "Compare side by side",
    description: "Review price, inclusions, and timelines — then accept one.",
  },
];

const PLACEHOLDER_PROPOSALS = [
  {
    package_name: "Modern 4-bed package",
    builder_name: "Builder A",
    base_price: 485000,
    estimated_build_weeks: 28,
    inclusions: "Stone benchtops, ducted AC, landscaping allowance",
  },
  {
    package_name: "Family 5-bed package",
    builder_name: "Builder B",
    base_price: 512000,
    estimated_build_weeks: 32,
    inclusions: "Double garage, alfresco, premium fixtures",
  },
];

function ProposalCardSkeleton({ ghost = false }: { ghost?: boolean }) {
  const sample = PLACEHOLDER_PROPOSALS[ghost ? 0 : 1];
  return (
    <Card
      className={cn(
        "overflow-hidden border-0",
        ghost && "pointer-events-none opacity-50"
      )}
      aria-hidden={ghost}
    >
      <LandThumbnail />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{sample.package_name}</CardTitle>
            <CardDescription>
              {sample.builder_name} · Leumeah
            </CardDescription>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {ghost ? "Pending" : "Example"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-baseline justify-between border-b border-black/[0.06] pb-3">
          <span className="label-caps">Package price</span>
          <span className="text-xl font-semibold tracking-tight">
            {formatProposalPrice(sample.base_price)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="label-caps mb-1">Build time</p>
            <p className="font-medium">{sample.estimated_build_weeks} weeks</p>
          </div>
          <div>
            <p className="label-caps mb-1">Status</p>
            <p className="font-medium">Awaiting review</p>
          </div>
        </div>
        <p className="text-muted-foreground">{sample.inclusions}</p>
        {ghost && (
          <div className="flex gap-2 pt-1">
            <div className="h-9 flex-1 rounded-full bg-muted" />
            <div className="h-9 flex-1 rounded-full bg-muted" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProposalCard({
  proposal,
  actingId,
  onRespond,
}: {
  proposal: ProposalRow;
  actingId: string | null;
  onRespond: (id: string, action: "accept" | "reject") => void;
}) {
  const isPending = ["pending", "viewed"].includes(proposal.status);

  return (
    <Card className="overflow-hidden border-0">
      <LandThumbnail />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{proposal.package_name}</CardTitle>
            <CardDescription>
              {proposal.builder_name ?? "Builder"} ·{" "}
              {proposal.listing_suburb ?? proposal.listing_address ?? "Land listing"}
            </CardDescription>
          </div>
          <Badge
            variant={proposal.status === "accepted" ? "default" : "secondary"}
            className="shrink-0 rounded-full"
          >
            {proposalStatusLabel(proposal.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-baseline justify-between border-b border-black/[0.06] pb-3">
          <span className="label-caps">Package price</span>
          <span className="text-xl font-semibold tracking-tight">
            {formatProposalPrice(proposal.base_price)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {proposal.estimated_build_weeks != null && (
            <div>
              <p className="label-caps mb-1">Build time</p>
              <p className="font-medium">
                {proposal.estimated_build_weeks} weeks
              </p>
            </div>
          )}
          <div>
            <p className="label-caps mb-1">Submitted</p>
            <p className="font-medium">
              {new Date(proposal.created_at).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </div>
        {proposal.inclusions && (
          <p className="leading-relaxed text-muted-foreground">
            {proposal.inclusions}
          </p>
        )}
        {isPending && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              disabled={actingId === proposal.id}
              className="flex-1 rounded-full"
              onClick={() => onRespond(proposal.id, "accept")}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={actingId === proposal.id}
              className="flex-1 rounded-full"
              onClick={() => onRespond(proposal.id, "reject")}
            >
              Decline
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompareEmptyLayout() {
  return (
    <div className="space-y-8">
      <EmptyState
        icon={<Scale className="h-6 w-6" strokeWidth={1.5} />}
        title="No proposals yet"
        description="Once builders submit packages on your sold lot, they'll appear here for side-by-side comparison."
        hint="Demo tip: run migration 010_demo_seed.sql after registering a buyer and builder — it seeds a sold lot at 7 Wattle Grove, Leumeah."
        action={
          <Link
            href="/buyer/map"
            className={cn(buttonVariants(), "rounded-full gap-2")}
          >
            Explore land on map
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div>
        <p className="label-caps mb-4">How it works</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {COMPARE_STEPS.map((step, i) => (
            <div key={step.title} className="surface-subtle p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                  {i + 1}
                </span>
                <step.icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="font-medium tracking-tight">{step.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="label-caps">Preview</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your comparison table will look like this
            </p>
          </div>
          <Badge variant="outline" className="rounded-full">
            Example data
          </Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ProposalCardSkeleton />
          <ProposalCardSkeleton ghost />
        </div>
      </div>
    </div>
  );
}

export function ProposalComparator() {
  const router = useRouter();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/proposals");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load proposals");
      setProposals([]);
      return;
    }
    setError(null);
    setProposals(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function respond(id: string, action: "accept" | "reject") {
    setActingId(id);
    const res = await fetch(`/api/proposals/${id}/respond`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    setActingId(null);

    if (!res.ok) {
      setError(data.error ?? "Action failed");
      return;
    }

    if (action === "accept" && data.project_id) {
      router.push(`/buyer/project/${data.project_id}`);
      return;
    }

    await load();
    router.refresh();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="surface-subtle h-20 animate-pulse" />
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Loading proposals…
        </p>
      </div>
    );
  }

  if (proposals.length === 0) {
    if (error) {
      return (
        <EmptyState
          icon={<Clock className="h-6 w-6" strokeWidth={1.5} />}
          title="Proposals unavailable"
          description={error}
          action={
            <Button variant="outline" className="rounded-full" onClick={() => load()}>
              Try again
            </Button>
          }
        />
      );
    }
    return <CompareEmptyLayout />;
  }

  const pending = proposals.filter((p) =>
    ["pending", "viewed"].includes(p.status)
  );
  const resolved = proposals.filter((p) =>
    ["accepted", "rejected"].includes(p.status)
  );
  const accepted = proposals.filter((p) => p.status === "accepted");

  return (
    <div className="space-y-8">
      <StatStrip
        items={[
          { label: "Total proposals", value: proposals.length },
          {
            label: "Awaiting decision",
            value: pending.length,
            sub: pending.length > 0 ? "Review and respond" : "All caught up",
          },
          {
            label: "Accepted",
            value: accepted.length,
            sub: accepted.length > 0 ? "Project started" : "None yet",
          },
        ]}
      />

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {pending.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-lg font-medium tracking-tight">
              Awaiting your decision
            </h2>
            <Badge variant="secondary" className="rounded-full">
              {pending.length}
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {pending.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                actingId={actingId}
                onRespond={respond}
              />
            ))}
            {pending.length === 1 && (
              <Card className="flex flex-col items-center justify-center border border-dashed border-black/[0.08] bg-muted/20 p-8 text-center">
                <Hammer className="mb-3 h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
                <p className="font-medium tracking-tight">Waiting for more proposals</p>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Other builders may still submit packages. Compare at least two before deciding.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-medium tracking-tight">
            Previous decisions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resolved.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                actingId={actingId}
                onRespond={respond}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
