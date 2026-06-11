import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatPrice,
  statusBadgeVariant,
  statusLabel,
  type LandListingRow,
} from "@/lib/listings";
import { ListingStatusToggle } from "@/components/listings/ListingStatusToggle";

type AgentListingsTableProps = {
  listings: LandListingRow[];
};

export function AgentListingsTable({ listings }: AgentListingsTableProps) {
  if (!listings.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No listings yet</CardTitle>
          <CardDescription>
            Create your first vacant land parcel to show on the buyer map.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/agent/listings/new" className={buttonVariants()}>
            Create first listing
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Address</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Size</th>
            <th className="px-4 py-3 font-medium">Zoning</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr key={listing.id} className="border-b last:border-0">
              <td className="px-4 py-3">
                <div className="font-medium">{listing.address}</div>
                <div className="text-muted-foreground">
                  {listing.suburb} {listing.postcode}
                </div>
              </td>
              <td className="px-4 py-3">{formatPrice(listing.price)}</td>
              <td className="px-4 py-3">{listing.land_size_sqm} m²</td>
              <td className="px-4 py-3">{listing.zoning}</td>
              <td className="px-4 py-3">
                <Badge variant={statusBadgeVariant(listing.status)}>
                  {statusLabel(listing.status)}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ListingStatusToggle
                    listingId={listing.id}
                    status={listing.status}
                  />
                  <Link
                    href={`/agent/listings/${listing.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    View
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
