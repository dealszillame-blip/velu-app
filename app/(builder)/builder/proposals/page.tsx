import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { formatProposalPrice, proposalStatusLabel } from "@/lib/proposals";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function BuilderProposalsPage() {
  const { user } = await requireRole(["builder"]);
  const supabase = await createClient();

  const { data: proposals } = await supabase
    .from("builder_proposals")
    .select(
      `
      id,
      package_name,
      base_price,
      status,
      created_at,
      land_listings (address, suburb)
    `
    )
    .eq("builder_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My proposals</h1>
        <p className="text-muted-foreground">
          Track proposals you have submitted to buyers.
        </p>
      </div>

      {!proposals?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>No proposals yet</CardTitle>
            <CardDescription>
              Submit your first proposal from a lead in the feed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/builder/leads" className={buttonVariants()}>
              View lead feed
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {proposals.map((proposal) => {
            const listing = Array.isArray(proposal.land_listings)
              ? proposal.land_listings[0]
              : proposal.land_listings;

            return (
              <Card key={proposal.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {proposal.package_name}
                      </CardTitle>
                      <CardDescription>
                        {listing
                          ? `${listing.address}, ${listing.suburb}`
                          : "Land listing"}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {proposalStatusLabel(proposal.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm">
                  <span className="font-medium">
                    {formatProposalPrice(proposal.base_price)}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
