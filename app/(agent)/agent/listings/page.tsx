import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AgentListingsTable } from "@/components/listings/AgentListingsTable";
import { buttonVariants } from "@/components/ui/button";
import type { LandListingRow } from "@/lib/listings";

export default async function AgentListingsPage() {
  const { user } = await requireRole(["agent", "pending_agent"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("land_listings")
    .select(
      "id, address, suburb, postcode, price, land_size_sqm, frontage_meters, zoning, status"
    )
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (data ?? []) as LandListingRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your listings</h1>
          <p className="text-muted-foreground">
            Manage vacant land parcels and update sale status.
          </p>
        </div>
        <Link href="/agent/listings/new" className={buttonVariants()}>
          Add listing
        </Link>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          Could not load listings: {error.message}
        </p>
      )}

      <AgentListingsTable listings={listings} />
    </div>
  );
}
