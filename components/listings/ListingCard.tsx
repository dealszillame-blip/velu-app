"use client";

import { LandThumbnail } from "@/components/shared/LandThumbnail";
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
    <Card className="overflow-hidden border-0 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
      <LandThumbnail />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{listing.address}</CardTitle>
            <CardDescription className="mt-1">
              {listing.suburb} {listing.postcode}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0 rounded-full">
            {statusLabel(listing.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between border-b border-black/[0.06] pb-3">
          <span className="label-caps">Price</span>
          <span className="text-xl font-semibold tracking-tight">
            {listingPriceLabel(listing)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <p className="label-caps mb-1">Size</p>
            <p className="font-medium">{listing.land_size_sqm} m²</p>
          </div>
          <div>
            <p className="label-caps mb-1">Frontage</p>
            <p className="font-medium">{listing.frontage_meters} m</p>
          </div>
          <div>
            <p className="label-caps mb-1">Zoning</p>
            <p className="font-medium">{listing.zoning}</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full pt-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Dismiss
          </button>
        )}
      </CardContent>
    </Card>
  );
}
