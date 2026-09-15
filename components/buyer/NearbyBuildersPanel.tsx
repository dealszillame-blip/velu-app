"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink, Home, MapPin, ShieldCheck, Star, Timer, Users } from "lucide-react";
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
import { builderTypeLabel } from "@/lib/builder-types";
import { cn } from "@/lib/utils";

type NearbyBuildersPanelProps = {
  parcel: BuyerOwnedLand;
};

function CriteriaRow({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
      <p className="mb-0.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium">{value}</p>
      )}
    </div>
  );
}

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
                {builder.builder_type ? (
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {builderTypeLabel(builder.builder_type)}
                  </Badge>
                ) : null}
                {builder.distance_km != null ? (
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {builder.distance_km} km away
                  </Badge>
                ) : null}
                {builder.source === "nsw_register" ? (
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    NSW register
                  </Badge>
                ) : builder.source === "onboarded" ? (
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    On Velu
                  </Badge>
                ) : null}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <CriteriaRow
                  icon={<Star className="h-3.5 w-3.5" />}
                  label="Google review"
                  value={
                    builder.google_rating != null
                      ? `${builder.google_rating.toFixed(1)}${
                          builder.google_review_count
                            ? ` (${builder.google_review_count})`
                            : ""
                        }`
                      : "Not listed"
                  }
                  href={builder.google_maps_url ?? undefined}
                />
                <CriteriaRow
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  label="Licence check"
                  value={
                    builder.is_license_valid
                      ? `Verified${builder.license_number ? ` · ${builder.license_number}` : ""}`
                      : builder.license_number
                        ? builder.license_number
                        : "Not verified"
                  }
                  href={builder.license_verify_url ?? undefined}
                />
                <CriteriaRow
                  icon={<Home className="h-3.5 w-3.5" />}
                  label="Last property sold"
                  value={
                    builder.last_property_sold_address
                      ? `${builder.last_property_sold_address}${
                          builder.last_property_sold_at
                            ? ` · ${new Date(builder.last_property_sold_at).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}`
                            : ""
                        }`
                      : "Not listed"
                  }
                />
                <CriteriaRow
                  icon={<Timer className="h-3.5 w-3.5" />}
                  label="Project delays"
                  value={
                    builder.avg_delay_weeks == null
                      ? "No delay record"
                      : builder.avg_delay_weeks === 0
                        ? "No recorded delays"
                        : `${builder.avg_delay_weeks} weeks average`
                  }
                />
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
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {builder.license_number ? (
                  <Badge variant="outline" className="rounded-full">
                    Licence {builder.license_number}
                  </Badge>
                ) : null}
                {builder.years_in_business != null ? (
                  <Badge variant="outline" className="rounded-full">
                    {builder.years_in_business}+ yrs
                  </Badge>
                ) : null}
                {builder.insurance_verified ? (
                  <Badge variant="outline" className="rounded-full">
                    Insurance verified
                  </Badge>
                ) : null}
              </div>
              {(builder.notices ?? []).length > 0 ? (
                <p className="mt-2 text-xs text-amber-700">
                  {builder.notices![0].title}
                </p>
              ) : builder.source === "nsw_register" ? null : builder.license_number ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  No licence notices on file.
                </p>
              ) : null}
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
        ) : builder.source === "nsw_register" ? null : (
          <p className="text-sm text-muted-foreground">
            No portfolio projects listed yet.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {builder.source === "nsw_register" ? (
            <a
              href={builder.license_verify_url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full gap-2"
              )}
            >
              <ExternalLink className="h-4 w-4" />
              Verify NSW licence
            </a>
          ) : builder.profile_published ? (
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
          {builder.source === "nsw_register" ? (
            builder.google_maps_url ? (
              <a
                href={builder.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-full"
                )}
              >
                Google reviews
              </a>
            ) : null
          ) : (
            <StartInquiryButton
              landListingId={parcel.id}
              counterpartyId={builder.id}
              messagesPath="/buyer/messages"
              label="Invite to review land"
              prefill={invitePrefill}
            />
          )}
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
    fetch(`/api/buyer/land/${parcel.id}/builders`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load builders.");
        }
        setBuilders(Array.isArray(data) ? data : []);
        setError(null);
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
        <p className="text-sm font-medium">No licensed builders in range yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Current NSW contractor-builder licences near {parcel.suburb} will
          appear here from the Fair Trading register, with Google ratings when
          they have been matched.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {builders.length} licensed builder{builders.length === 1 ? "" : "s"} near{" "}
        {parcel.suburb} from the NSW register (not Velu accounts). Criteria:
        Google review, licence check, last property sold, and project delays.
      </p>
      {builders.map((builder) => (
        <NearbyBuilderCard key={builder.id} builder={builder} parcel={parcel} />
      ))}
    </div>
  );
}
