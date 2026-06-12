import Link from "next/link";
import { notFound } from "next/navigation";
import { MilestoneTracker } from "@/components/projects/MilestoneTracker";
import { requireRole } from "@/lib/auth";
import { MILESTONE_LABELS } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConstructionMilestone } from "@/lib/types";

const STAGES: ConstructionMilestone[] = [
  "contract",
  "slab",
  "frame",
  "lockup",
  "fixing",
  "completion",
];

export async function ProjectPageContent({
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

  const { data: builderProfile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", project.builder_id)
    .single();

  const listingRaw = project.land_listings;
  const listing = Array.isArray(listingRaw) ? listingRaw[0] : listingRaw;

  const isBuilder = profile.role === "builder";
  const currentStage = project.current_stage as ConstructionMilestone;
  const currentIndex = STAGES.indexOf(currentStage);
  const progressPct = Math.round(((currentIndex + 1) / STAGES.length) * 100);
  const builderName =
    builderProfile?.company_name ?? builderProfile?.full_name ?? "Builder";
  const isComplete = currentStage === "completion";

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-1.5 rounded-full -ml-2"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Project hero */}
      <div className="surface overflow-hidden">
        {/* Progress bar header */}
        <div className="relative h-2 bg-muted">
          <div
            className="absolute inset-y-0 left-0 bg-foreground transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label-caps mb-1">Build project</p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {listing ? `${listing.suburb}` : "Your project"}
              </h1>
              {listing && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {listing.address}, {listing.postcode}
                </p>
              )}
            </div>
            <Badge
              variant={isComplete ? "default" : "secondary"}
              className="shrink-0 rounded-full"
            >
              {isComplete ? "Complete" : "In progress"}
            </Badge>
          </div>

          {/* Key info strip */}
          <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-black/[0.06]">
            <div className="bg-card px-4 py-3 text-center">
              <p className="label-caps">Stage</p>
              <p className="mt-1 font-semibold">{MILESTONE_LABELS[currentStage]}</p>
            </div>
            <div className="bg-card px-4 py-3 text-center">
              <p className="label-caps">Progress</p>
              <p className="mt-1 font-semibold">{progressPct}%</p>
            </div>
            <div className="bg-card px-4 py-3 text-center">
              <p className="label-caps">Remaining</p>
              <p className="mt-1 font-semibold">{STAGES.length - currentIndex - 1} stages</p>
            </div>
          </div>

          {/* Builder */}
          <div className="mt-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium">{builderName}</p>
              <p className="text-xs text-muted-foreground">Your builder</p>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone tracker */}
      <div className="surface-subtle overflow-hidden">
        <div className="border-b border-black/[0.06] px-5 py-4 sm:px-6">
          <p className="font-medium tracking-tight">Construction milestones</p>
          <p className="text-sm text-muted-foreground">
            {isBuilder
              ? "Advance the stage as each phase completes."
              : "Track your build progress stage by stage."}
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <MilestoneTracker
            projectId={project.id}
            currentStage={currentStage}
            canAdvance={isBuilder && project.builder_id === user.id}
          />
        </div>
      </div>
    </div>
  );
}
