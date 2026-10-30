import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { formatAuDate } from "@/lib/defects";
import { readCounterpartyProfile } from "@/lib/inquiries";
import { projectPartyName } from "@/lib/milestones";
import { formatProposalPrice } from "@/lib/proposals";
import { contractTypeLabel } from "@/lib/quote-structure";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Listing = { address?: string | null; suburb?: string | null };

function oneListing(row: Listing | Listing[] | null): Listing | null {
  if (!row) return null;
  return Array.isArray(row) ? row[0] ?? null : row;
}

export async function BuyerContracts() {
  const { user } = await requireRole(["buyer"]);
  const supabase = await createClient();

  const [{ data: proposals }, { data: projects }] = await Promise.all([
    supabase
      .from("builder_proposals")
      .select(
        `
        id,
        package_name,
        base_price,
        contract_type,
        responded_at,
        builder_id,
        land_listing_id,
        land_listings (address, suburb)
      `
      )
      .eq("buyer_id", user.id)
      .eq("status", "accepted")
      .order("responded_at", { ascending: false }),
    supabase
      .from("construction_projects")
      .select("id, land_listing_id")
      .eq("buyer_id", user.id),
  ]);

  if (!proposals?.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6">
        <p className="font-medium">No contract yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Accept a proposal first. That is what finalises the contract.
        </p>
        <Link
          href="/buyer/compare"
          className={cn(buttonVariants({ size: "sm" }), "mt-4 rounded-full")}
        >
          Review proposals
        </Link>
      </div>
    );
  }

  const projectByListing = new Map(
    (projects ?? []).map((project) => [project.land_listing_id, project.id as string])
  );

  const cards = await Promise.all(
    proposals.map(async (proposal) => {
      const listing = oneListing(proposal.land_listings as Listing | Listing[] | null);
      const builder = await readCounterpartyProfile(proposal.builder_id);
      return {
        id: proposal.id as string,
        packageName: (proposal.package_name as string) || "Proposal",
        price: formatProposalPrice(Number(proposal.base_price)),
        contractType: contractTypeLabel(proposal.contract_type as string | null),
        when: formatAuDate(proposal.responded_at as string | null),
        place: [listing?.address, listing?.suburb].filter(Boolean).join(", ") || "Your land",
        builderName: projectPartyName(builder, "builder"),
        projectId: projectByListing.get(proposal.land_listing_id) ?? null,
      };
    })
  );

  return (
    <div className="space-y-4">
      {cards.map((contract) => (
        <article key={contract.id} className="rounded-xl border border-border p-5">
          <p className="label-caps">Finalised</p>
          <h2 className="mt-1 text-lg font-medium">{contract.place}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {contract.packageName}. {contract.contractType}. {contract.price}.
            {contract.builderName ? ` Builder: ${contract.builderName}.` : ""}
            {contract.when ? ` Accepted ${contract.when}.` : ""}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This is the contract between you and the builder. bldwise does not sign it or hold the money.
          </p>
          {contract.projectId ? (
            <Link
              href={`/buyer/project/${contract.projectId}/milestones`}
              className={cn(buttonVariants({ size: "sm" }), "mt-4 rounded-full")}
            >
              Open the build
            </Link>
          ) : null}
        </article>
      ))}
    </div>
  );
}
