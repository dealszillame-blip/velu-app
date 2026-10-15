import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { formatAuDate } from "@/lib/defects";
import { readCounterpartyProfile } from "@/lib/inquiries";
import { buyerMilestoneFocus, isBuildComplete, projectPartyName } from "@/lib/milestones";
import { createClient } from "@/lib/supabase/server";
import { MILESTONE_LABELS, type ConstructionMilestone } from "@/lib/types";
import { cn } from "@/lib/utils";

type Listing = { address?: string | null; suburb?: string | null; postcode?: string | null };

function oneListing(row: Listing | Listing[] | null): Listing | null {
  if (!row) return null;
  return Array.isArray(row) ? row[0] ?? null : row;
}

export async function BuyerBuilds() {
  const { user } = await requireRole(["buyer"]);
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("construction_projects")
    .select(
      `
      id,
      builder_id,
      current_stage,
      created_at,
      land_listings (address, suburb, postcode)
    `
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (!projects?.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6">
        <p className="font-medium">No contract executed yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Accept a proposal on Compare. That acceptance is the contract execution,
          and the build then appears here with its completed stages.
        </p>
        <Link
          href="/buyer/compare"
          className={cn(buttonVariants({ size: "sm" }), "mt-4 rounded-full")}
        >
          Go to Compare
        </Link>
      </div>
    );
  }

  const cards = await Promise.all(
    projects.map(async (project) => {
      const stage = project.current_stage as ConstructionMilestone;
      const focus = buyerMilestoneFocus(stage);
      const complete = isBuildComplete(stage);
      const listing = oneListing(project.land_listings as Listing | Listing[] | null);
      const builder = await readCounterpartyProfile(project.builder_id);
      const executed = formatAuDate(project.created_at);
      const place =
        [listing?.address, listing?.suburb].filter(Boolean).join(", ") || "Your build";
      const doneLabels = focus.done.map((item) => MILESTONE_LABELS[item]);

      return {
        id: project.id as string,
        place,
        postcode: listing?.postcode,
        builderName: projectPartyName(builder, "builder"),
        executed,
        complete,
        stage,
        doneLabels,
      };
    })
  );

  return (
    <div className="space-y-4">
      {cards.map((project) => (
        <article key={project.id} className="rounded-xl border border-border p-5">
          <p className="label-caps">
            {project.complete ? "Build complete" : "Contract executed"}
          </p>
          <h2 className="mt-1 text-lg font-medium">{project.place}</h2>
          {project.postcode ? (
            <p className="text-sm text-muted-foreground">{project.postcode}</p>
          ) : null}
          <p className="mt-3 text-sm text-muted-foreground">
            {project.executed
              ? `Contract executed ${project.executed}, when you accepted the proposal.`
              : "Contract executed when you accepted the proposal."}{" "}
            {project.builderName ? `${project.builderName} is the builder. ` : ""}
            {project.stage === "contract"
              ? "Contract is still the open stage."
              : "Contract is done."}
          </p>
          <div className="mt-4">
            <p className="text-sm font-medium">
              {project.complete ? "Completed stages" : "Completed so far"}
            </p>
            {project.doneLabels.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {project.doneLabels.map((label) => (
                  <li key={label} className="text-sm text-muted-foreground">
                    {label} — done
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No stage is complete yet. Contract is open.
              </p>
            )}
          </div>
          {!project.complete ? (
            <p className="mt-3 text-sm">
              Current stage: {MILESTONE_LABELS[project.stage]}
            </p>
          ) : null}
          <Link
            href={`/buyer/project/${project.id}/milestones`}
            className={cn(buttonVariants({ size: "sm" }), "mt-4 rounded-full")}
          >
            {project.complete ? "View finished build" : "View progress"}
          </Link>
        </article>
      ))}
    </div>
  );
}
