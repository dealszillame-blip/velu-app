"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  listingPriceLabel,
  statusBadgeVariant,
  statusLabel,
  type LandListingRow,
  type MapListing,
} from "@/lib/listings";

type ListingCardProps = {
  listing: LandListingRow | MapListing;
  onClose?: () => void;
};

export function ListingCard({ listing, onClose }: ListingCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{listing.address}</CardTitle>
            <CardDescription>
              {listing.suburb} {listing.postcode}
            </CardDescription>
          </div>
          <Badge variant={statusBadgeVariant(listing.status)}>
            {statusLabel(listing.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Price</span>
          <span className="font-medium">{listingPriceLabel(listing)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Land size</span>
          <span>{listing.land_size_sqm} m²</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Frontage</span>
          <span>{listing.frontage_meters} m</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Zoning</span>
          <span>{listing.zoning}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-2 text-xs text-muted-foreground underline"
          >
            Close
          </button>
        )}
      </CardContent>
    </Card>
  );
}
