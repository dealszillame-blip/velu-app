"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, MapPin, Users } from "lucide-react";
import { StartInquiryButton } from "@/components/messages/StartInquiryButton";
import { StarRating } from "@/components/builder/StarRating";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BuyerOwnedLand } from "@/lib/buyer-land";
import {
  displayNearbyBuilderName,
  inviteToReviewPrefill,
  type NearbyBuilder,
} from "@/lib/nearby-builders";
import { cn } from "@/lib/utils";

type NearbyBuildersPanelProps = {
  parcel: BuyerOwnedLand;
};

function NearbyBuilderCard({
  builder,
  parcel,
}: {
  builder: NearbyBuilder;
  parcel: BuyerOwnedLand;
}) {
  const name = displayNearbyBuilderName(builder);
  const invitePrefill = inviteToReviewPrefill(parcel.suburb, parcel.address);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
              {builder.avatar_url ? (
                <Image
                  src={builder.avatar_url}
                  alt={name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-primary">
                  {name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">{name}</CardTitle>
              {builder.headline && (
                <CardDescription className="mt-1 line-clamp-2">
                  {builder.headline}
                </CardDescription>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {builder.anchor_address && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {builder.anchor_address}
                  </span>
                )}
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {builder.distance_km} km away
                </Badge>
              </div>
              {builder.google_rating != null && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <StarRating rating={builder.google_rating} size="sm" />
                  <span className="text-muted-foreground">
                    {builder.google_rating.toFixed(1)}
                    {builder.google_review_count
                      ? ` (${builder.google_review_count})`
                      : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {builder.portfolio.length > 0 ? (
          <div>
            <p className="label-caps mb-2">Portfolio</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {builder.portfolio.map((project) => (
                <div
                  key={project.id}
                  className="overflow-hidden rounded-xl border border-border bg-muted/20"
                >
                  <div className="relative aspect-[4/3] bg-muted">
                    {project.image_url ? (
                      <Image
                        src={project.image_url}
                        alt={project.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-sm font-medium">{project.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[project.location, project.completed_year]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No portfolio projects listed yet.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {builder.profile_published ? (
            <Link
              href={`/builders/${builder.id}`}
              target="_blank"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full gap-2"
              )}
            >
              <ExternalLink className="h-4 w-4" />
              View full profile
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-full border border-dashed px-3 py-1.5 text-xs text-muted-foreground">
              Profile not published yet
            </span>
          )}
          <StartInquiryButton
            landListingId={parcel.id}
            counterpartyId={builder.id}
            messagesPath="/buyer/messages"
            label="Invite to review land"
            prefill={invitePrefill}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function NearbyBuildersPanel({ parcel }: NearbyBuildersPanelProps) {
  const [builders, setBuilders] = useState<NearbyBuilder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/buyer/land/${parcel.id}/builders`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load builders.");
        }
        setBuilders(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => {
        setError(err.message);
        setBuilders([]);
      })
      .finally(() => setLoading(false));
  }, [parcel.id]);

  if (loading) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        Finding builders serving {parcel.suburb}…
      </p>
    );
  }

  if (error) {
    return (
      <p className="py-6 text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (builders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
        <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">No matched builders yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Builders within service range of {parcel.suburb} will appear here once
          they complete onboarding.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {builders.length} builder{builders.length === 1 ? "" : "s"} service{" "}
        {parcel.suburb} and surrounding areas. Review portfolios and invite
        them to look at your block.
      </p>
      {builders.map((builder) => (
        <NearbyBuilderCard key={builder.id} builder={builder} parcel={parcel} />
      ))}
    </div>
  );
}
