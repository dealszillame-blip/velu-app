import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, UserRound } from "lucide-react";
import { MilestoneTracker } from "@/components/projects/MilestoneTracker";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { readCounterpartyProfile } from "@/lib/inquiries";
import { milestoneProgress, projectPartyName } from "@/lib/milestones";
import { createClient } from "@/lib/supabase/server";
import { MILESTONE_LABELS, type ConstructionMilestone } from "@/lib/types";
import { cn } from "@/lib/utils";

export async function MilestonePageContent({
  projectId,
  backHref,
}: {
  projectId: string;
  backHref: string;
}) {
  const { user, profile } = await requireRole(["buyer", "builder"]);
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("construction_projects")
    .select(
      `
      id,
      buyer_id,
      builder_id,
      current_stage,
      stage_updated_at,
      land_listings (address, suburb, postcode)
    `
    )
    .eq("id", projectId)
    .single();

  if (
    !project ||
    (project.buyer_id !== user.id && project.builder_id !== user.id)
  ) {
    notFound();
  }

  const [builderProfile, buyerProfile] = await Promise.all([
    readCounterpartyProfile(project.builder_id),
    readCounterpartyProfile(project.buyer_id),
  ]);

  const listingRaw = project.land_listings;
  const listing = Array.isArray(listingRaw) ? listingRaw[0] : listingRaw;
  const currentStage = project.current_stage as ConstructionMilestone;
  const progress = milestoneProgress(currentStage);
  const isBuilder = profile.role === "builder";
  const builderName =
    projectPartyName(builderProfile, "builder") ??
    (project.builder_id === user.id ? projectPartyName(profile, "builder") : null);
  const buyerName =
    projectPartyName(buyerProfile, "buyer") ??
    (project.buyer_id === user.id ? projectPartyName(profile, "buyer") : null);
  const updated = formatUpdated(project.stage_updated_at);

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 gap-1.5 rounded-full"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Project
      </Link>

      <div className="surface overflow-hidden">
        <div className="relative h-2 bg-muted">
          <div
            className="absolute inset-y-0 left-0 bg-foreground transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label-caps mb-1">Build milestones</p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {listing?.suburb ?? "Your build"}
              </h1>
              {listing && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {listing.address}, {listing.postcode}
                </p>
              )}
            </div>
            <Badge
              variant={progress.complete ? "default" : "secondary"}
              className="shrink-0 rounded-full"
            >
              {progress.complete ? "Complete" : "In progress"}
            </Badge>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-black/[0.06]">
            <div className="bg-card px-4 py-3 text-center">
              <p className="label-caps">Stage</p>
              <p className="mt-1 font-semibold">
                {progress.complete ? "Finished" : MILESTONE_LABELS[currentStage]}
              </p>
            </div>
            <div className="bg-card px-4 py-3 text-center">
              <p className="label-caps">Progress</p>
              <p className="mt-1 font-semibold">{progress.percent}%</p>
            </div>
            <div className="bg-card px-4 py-3 text-center">
              <p className="label-caps">Remaining</p>
              <p className="mt-1 font-semibold">
                {progress.complete
                  ? "None"
                  : `${progress.remaining} ${progress.remaining === 1 ? "stage" : "stages"}`}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-px overflow-hidden rounded-xl bg-black/[0.06] sm:grid-cols-2">
            <Party
              label="Builder company"
              name={builderName}
              icon={<Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />}
            />
            <Party
              label="Buyer name"
              name={buyerName}
              icon={<UserRound className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />}
            />
          </div>

          {updated && (
            <p className="mt-4 text-xs text-muted-foreground">
              {progress.complete ? "Handed over" : "Stage updated"} {updated}
            </p>
          )}
        </div>
      </div>

      <div className="surface-subtle overflow-hidden">
        <div className="border-b border-black/[0.06] px-5 py-4 sm:px-6">
          <p className="font-medium tracking-tight">
            {progress.complete ? "Finished build" : "Stage by stage"}
          </p>
          <p className="text-sm text-muted-foreground">
            {progress.complete
              ? "Every stage from Contract to Handover is done."
              : isBuilder
                ? "Advance one stage at a time as each phase completes."
                : "Follow the build. Only the builder can advance a stage."}
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <MilestoneTracker
            projectId={project.id}
            currentStage={currentStage}
            canAdvance={isBuilder && project.builder_id === user.id}
            variant="timeline"
            builderName={builderName}
            buyerName={buyerName}
          />
        </div>
      </div>
    </div>
  );
}

function Party({
  label,
  name,
  icon,
}: {
  label: string;
  name: string | null;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-card px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="label-caps">{label}</p>
        <p className="truncate text-sm font-medium">
          {name ?? "Name not on file"}
        </p>
      </div>
    </div>
  );
}

function formatUpdated(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
