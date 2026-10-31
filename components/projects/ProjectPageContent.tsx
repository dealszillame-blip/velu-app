import Link from "next/link";
import { notFound } from "next/navigation";
import { SavedLandSketch } from "@/components/buyer/SavedLandSketch";
import { BuildDocumentsPanel } from "@/components/projects/BuildDocumentsPanel";
import { MilestoneTracker } from "@/components/projects/MilestoneTracker";
import { PostHandoverSection } from "@/components/projects/PostHandoverSection";
import { normalizeBuildRequirements } from "@/lib/buyer-requirements";
import { requireRole } from "@/lib/auth";
import { readCounterpartyProfile } from "@/lib/inquiries";
import { milestoneProgress, projectPartyName } from "@/lib/milestones";
import { MILESTONE_LABELS } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Building2, MapPin, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConstructionMilestone } from "@/lib/types";

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

  const { data: rawBrief } = await supabase.rpc("get_buyer_build_requirements", {
    p_buyer_id: project.buyer_id,
  });
  const savedSides = normalizeBuildRequirements(rawBrief).boundary_sides ?? [];

  const listingRaw = project.land_listings;
  const listing = Array.isArray(listingRaw) ? listingRaw[0] : listingRaw;

  const isBuilder = profile.role === "builder";
  const currentStage = project.current_stage as ConstructionMilestone;
  const progress = milestoneProgress(currentStage);
  const builderName =
    projectPartyName(builderProfile, "builder") ??
    (project.builder_id === user.id ? projectPartyName(profile, "builder") : null);
  const buyerName =
    projectPartyName(buyerProfile, "buyer") ??
    (project.buyer_id === user.id ? projectPartyName(profile, "buyer") : null);
  const milestonesHref = `${isBuilder ? "/builder" : "/buyer"}/project/${project.id}/milestones`;

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
            style={{ width: `${progress.percent}%` }}
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
              variant={progress.complete ? "default" : "secondary"}
              className="shrink-0 rounded-full"
            >
              {progress.complete ? "Complete" : "In progress"}
            </Badge>
          </div>

          {/* Key info strip */}
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
            <div className="flex items-center gap-2.5 bg-card px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="label-caps">Builder company</p>
                <p className="truncate text-sm font-medium">
                  {builderName ?? "Name not on file"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-card px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <UserRound className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="label-caps">Buyer name</p>
                <p className="truncate text-sm font-medium">
                  {buyerName ?? "Name not on file"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {savedSides.length >= 4 ? (
        <SavedLandSketch
          sides={savedSides}
          description={
            isBuilder
              ? "The buyer saved these sides in order, starting at the front."
              : "Saved with your block. Your builder sees this same sketch."
          }
        />
      ) : null}

      {/* Milestone tracker */}
      <div className="surface-subtle overflow-hidden">
        <div className="border-b border-black/[0.06] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium tracking-tight">Construction milestones</p>
              <p className="text-sm text-muted-foreground">
                {progress.complete
                  ? "This build is finished. Open the timeline to see every stage done. Defects and the statutory warranty are below."
                  : isBuilder
                    ? "Open the milestone page to confirm you received payment. That moves one stage. bldwise does not transfer the money."
                    : "Open the milestone page for this stage and the payment details the builder supplied. You cannot mark a stage paid."}
              </p>
            </div>
            <Link
              href={milestonesHref}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
            >
              {progress.complete ? "View finished build" : "View milestones"}
            </Link>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <MilestoneTracker
            projectId={project.id}
            currentStage={currentStage}
            canAdvance={isBuilder && project.builder_id === user.id}
            builderName={builderName}
            buyerName={buyerName}
          />
        </div>
      </div>

      <BuildDocumentsPanel
        projectId={project.id}
        canUpload={!isBuilder && project.buyer_id === user.id}
      />

      <PostHandoverSection
        projectId={project.id}
        stage={currentStage}
        role={isBuilder ? "builder" : "buyer"}
        handoverAt={project.stage_updated_at}
      />
    </div>
  );
}
