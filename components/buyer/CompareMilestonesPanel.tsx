"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MILESTONE_LABELS, type ConstructionMilestone } from "@/lib/types";
import { isBuildComplete } from "@/lib/milestones";
import { cn } from "@/lib/utils";

type WorkspaceProject = {
  id: string;
  buyer_id: string;
  builder_id: string;
  current_stage: ConstructionMilestone;
  land_listings: { address: string; suburb: string } | { address: string; suburb: string }[] | null;
};

function listingLabel(row: WorkspaceProject["land_listings"]) {
  const listing = Array.isArray(row) ? row[0] : row;
  if (!listing) return "Your project";
  return [listing.address, listing.suburb].filter(Boolean).join(", ");
}

export function CompareMilestonesPanel() {
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workspace/projects")
      .then(async (res) => {
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data.error ?? "Failed to load milestones.");
        setProjects(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="py-6 text-sm text-muted-foreground">Loading milestones…</p>
    );
  }

  if (error) {
    return (
      <p className="py-6 text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6">
        <p className="font-medium">No build started yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Accept a proposal on Compare and the milestone page (Contract through
          Handover) will be linked here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const complete = isBuildComplete(project.current_stage);
        const milestonesHref = `/buyer/project/${project.id}/milestones`;
        return (
          <div key={project.id} className="rounded-xl border border-border p-5">
            <p className="label-caps">After proposal</p>
            <h2 className="mt-1 text-lg font-medium">
              {listingLabel(project.land_listings)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {complete
                ? "Build complete. Handover is done. Open the project or the milestone page for defects and the statutory warranty."
                : `Current stage: ${MILESTONE_LABELS[project.current_stage]}. You can view the timeline and cannot advance a stage.`}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Link
                href={milestonesHref}
                className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
              >
                {complete ? "View finished build" : "View milestones"}
              </Link>
              <Link
                href={`/buyer/project/${project.id}`}
                className="text-sm font-medium underline-offset-2 hover:underline"
              >
                Open project
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
