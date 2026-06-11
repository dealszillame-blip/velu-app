import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingStatusToggle } from "@/components/listings/ListingStatusToggle";
import { buttonVariants } from "@/components/ui/button";
import type { LandListingRow } from "@/lib/listings";

export default async function AgentListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireRole(["agent", "pending_agent"]);
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("land_listings")
    .select(
      "id, address, suburb, postcode, price, land_size_sqm, frontage_meters, zoning, status, agent_id"
    )
    .eq("id", id)
    .single();

  if (error || !listing || listing.agent_id !== user.id) notFound();

  const cardListing = listing as LandListingRow;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Listing detail</h1>
          <p className="text-muted-foreground">
            Update status as the sale progresses.
          </p>
        </div>
        <Link
          href="/agent/listings"
          className={buttonVariants({ variant: "outline" })}
        >
          Back to listings
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <ListingCard listing={cardListing} />

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-medium">Status</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Advance: Available → Under offer → Sold. Marking as sold will
            notify nearby builders in Week 3.
          </p>
          <ListingStatusToggle
            listingId={cardListing.id}
            status={cardListing.status}
          />
        </div>
      </div>
    </div>
  );
}
