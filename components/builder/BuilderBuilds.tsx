import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { formatAuDate } from "@/lib/defects";
import { readCounterpartyProfile } from "@/lib/inquiries";
import { isBuildComplete, projectPartyName } from "@/lib/milestones";
import { createClient } from "@/lib/supabase/server";
import { MILESTONE_LABELS, type ConstructionMilestone } from "@/lib/types";
import { cn } from "@/lib/utils";

type Listing = { address?: string | null; suburb?: string | null };

function oneListing(row: Listing | Listing[] | null): Listing | null {
  if (!row) return null;
  return Array.isArray(row) ? row[0] ?? null : row;
}

export async function BuilderBuilds() {
  const { user } = await requireRole(["builder"]);
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("construction_projects")
    .select(
      `
      id,
      buyer_id,
      current_stage,
      created_at,
      land_listings (address, suburb)
    `
    )
    .eq("builder_id", user.id)
    .order("created_at", { ascending: false });

  if (!projects?.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6">
        <p className="font-medium">No accepted proposal yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          A build opens here when a buyer accepts your proposal. Until then, start from Leads.
        </p>
        <Link
          href="/builder/leads"
          className={cn(buttonVariants({ size: "sm" }), "mt-4 rounded-full")}
        >
          Go to Leads
        </Link>
      </div>
    );
  }

  const cards = await Promise.all(
    projects.map(async (project) => {
      const stage = project.current_stage as ConstructionMilestone;
      const listing = oneListing(project.land_listings as Listing | Listing[] | null);
      const buyer = await readCounterpartyProfile(project.buyer_id);
      return {
        id: project.id as string,
        place: [listing?.address, listing?.suburb].filter(Boolean).join(", ") || "Build",
        buyerName: projectPartyName(buyer, "buyer"),
        executed: formatAuDate(project.created_at),
        complete: isBuildComplete(stage),
        stage,
      };
    })
  );

  return (
    <div className="space-y-4">
      {cards.map((project) => (
        <article key={project.id} className="rounded-xl border border-border p-5">
          <p className="label-caps">{project.complete ? "Handed over" : "In progress"}</p>
          <h2 className="mt-1 text-lg font-medium">{project.place}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {project.executed ? `Contract executed ${project.executed}. ` : ""}
            {project.buyerName ? `Buyer: ${project.buyerName}. ` : ""}
            {project.complete
              ? "Every stage is done. Defects are on the build page."
              : `Open stage: ${MILESTONE_LABELS[project.stage]}. Confirm payment received to move one stage.`}
          </p>
          <Link
            href={`/builder/project/${project.id}/milestones`}
            className={cn(buttonVariants({ size: "sm" }), "mt-4 rounded-full")}
          >
            {project.complete ? "View finished build" : "Open this build"}
          </Link>
        </article>
      ))}
    </div>
  );
}
