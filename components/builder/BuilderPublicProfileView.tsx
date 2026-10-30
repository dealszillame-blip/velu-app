import Image from "next/image";
import Link from "next/link";
import {
  Award,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { StarRating } from "@/components/builder/StarRating";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { BuilderPublicProfile } from "@/lib/builder-profile";
import { displayBuilderName } from "@/lib/builder-profile";
import { ratingDisplay } from "@/lib/builder-ratings";
import { formatProposalPrice } from "@/lib/proposals";
import { cn } from "@/lib/utils";

type BuilderPublicProfileViewProps = {
  profile: BuilderPublicProfile;
  preview?: boolean;
  editHref?: string;
};

export function BuilderPublicProfileView({
  profile,
  preview = false,
  editHref,
}: BuilderPublicProfileViewProps) {
  const name = displayBuilderName(profile);
  const rating = ratingDisplay({
    google_rating: profile.google_rating,
    google_review_count: profile.google_review_count,
    google_maps_url: profile.google_maps_url,
  });

  return (
    <div className="space-y-8">
      <div className="surface overflow-hidden">
        <div className="relative h-36 bg-gradient-to-r from-[#13314c] to-[#1d3a58] sm:h-44">
          {profile.cover_image_url ? (
            <Image
              src={profile.cover_image_url}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : null}
          {preview && !profile.profile_published && (
            <Badge className="absolute right-4 top-4 rounded-full" variant="secondary">
              Draft — not public yet
            </Badge>
          )}
        </div>
        <div className="relative px-5 pb-6 pt-0 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-muted sm:h-24 sm:w-24">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-primary">
                    {name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {name}
                </h1>
                {profile.headline && (
                  <p className="mt-1 text-base text-muted-foreground">
                    {profile.headline}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {profile.anchor_address && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {profile.anchor_address}
                    </span>
                  )}
                  {profile.insurance_verified && (
                    <Badge variant="outline" className="rounded-full gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Velu verified
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm font-medium">
                  <a href="#inclusions" className="text-primary underline-offset-2 hover:underline">
                    Inclusions
                  </a>
                  <a href="#offers" className="text-primary underline-offset-2 hover:underline">
                    Offers
                  </a>
                  <a href="#photos" className="text-primary underline-offset-2 hover:underline">
                    Photos
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {editHref && (
                <Link
                  href={editHref}
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
                >
                  Edit profile
                </Link>
              )}
              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants(), "rounded-full gap-2")}
                >
                  Website
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {profile.google_maps_url && (
                <a
                  href={profile.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "rounded-full gap-2"
                  )}
                >
                  Google
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-black/[0.06] pt-6 sm:grid-cols-4">
            {rating ? (
              <div className="surface-subtle p-4">
                <p className="label-caps mb-1">{rating.label}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      rating.source === "google"
                        ? "text-2xl font-semibold"
                        : "text-lg font-medium text-muted-foreground"
                    }
                  >
                    {rating.rating.toFixed(1)}
                  </span>
                  {rating.source === "google" ? (
                    <StarRating rating={rating.rating} size="md" />
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {rating.reviewCount != null
                    ? `${rating.reviewCount} reviews`
                    : "Review count not verified"}
                </p>
              </div>
            ) : null}
            {profile.years_in_business != null && (
              <div className="surface-subtle p-4">
                <p className="label-caps mb-1">Experience</p>
                <p className="text-2xl font-semibold">
                  {profile.years_in_business}+ yrs
                </p>
              </div>
            )}
            <div className="surface-subtle p-4">
              <p className="label-caps mb-1">Service area</p>
              <p className="text-2xl font-semibold">
                {profile.service_radius_km} km
              </p>
            </div>
            <div className="surface-subtle p-4">
              <p className="label-caps mb-1">Licence</p>
              <p className="text-2xl font-semibold">
                {profile.license_number || "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {profile.insurance_verified
                  ? "Insurance verified"
                  : "Insurance not verified"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
            <p className="label-caps mb-2">Licence notices</p>
            {(profile.notices ?? []).length > 0 ? (
              <ul className="space-y-2 text-sm">
                {(profile.notices ?? []).map((notice) => (
                  <li key={notice.id}>
                    <p className="font-medium">{notice.title}</p>
                    <p className="text-muted-foreground">{notice.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No Fair Trading or licence notices on file for this builder.
              </p>
            )}
          </div>

          {profile.bio && (
            <div className="mt-6">
              <p className="label-caps mb-2">About</p>
              <p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {profile.bio}
              </p>
            </div>
          )}
        </div>
      </div>

      <section id="inclusions" className="scroll-mt-6">
        <p className="label-caps mb-4">Inclusions</p>
        {(profile.inclusions ?? []).length > 0 ? (
          <div className="space-y-4">
            {(profile.inclusions ?? []).map((group) => {
              const included = group.items.filter((item) => item.included !== false);
              const excluded = group.items.filter((item) => item.included === false);
              return (
                <article key={group.id} className="surface-subtle p-5">
                  <h2 className="font-semibold tracking-tight">{group.title}</h2>
                  {group.summary ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {group.summary}
                    </p>
                  ) : null}
                  {included.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-sm">
                      {included.map((item) => (
                        <li key={`${group.id}-${item.category}-${item.item}`}>
                          <span className="font-medium">{item.item}</span>
                          {item.detail ? (
                            <span className="text-muted-foreground"> — {item.detail}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {excluded.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Exclusions
                      </p>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {excluded.map((item) => (
                          <li key={`${group.id}-ex-${item.category}-${item.item}`}>
                            {item.item}
                            {item.detail ? ` — ${item.detail}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Inclusions from this builder’s quotes appear here, including anything
            they have marked as excluded.
          </p>
        )}
      </section>

      <section id="offers" className="scroll-mt-6">
        <p className="label-caps mb-4">Offers</p>
        {(profile.offers ?? []).length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(profile.offers ?? []).map((offer) => (
              <article key={offer.id} className="surface-subtle p-5">
                <h2 className="font-semibold tracking-tight">{offer.name}</h2>
                {offer.meta ? (
                  <p className="mt-1 text-sm text-muted-foreground">{offer.meta}</p>
                ) : null}
                {offer.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {offer.description}
                  </p>
                ) : null}
                {offer.price != null ? (
                  <p className="mt-3 text-sm font-medium">
                    From {formatProposalPrice(offer.price)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This builder has not published offers yet.
          </p>
        )}
      </section>

      <section id="photos" className="scroll-mt-6">
        <p className="label-caps mb-4">Photos</p>
        {profile.gallery.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {profile.gallery.map((photo) => (
              <figure key={photo.id ?? photo.image_url} className="surface-subtle overflow-hidden">
                <div className="relative aspect-square bg-muted">
                  <Image
                    src={photo.image_url}
                    alt={photo.caption ?? "Gallery photo"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {photo.caption && (
                  <figcaption className="p-2 text-xs text-muted-foreground">
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No photos published yet.
          </p>
        )}
      </section>

      {profile.portfolio.length > 0 && (
        <section>
          <p className="label-caps mb-4">Portfolio</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.portfolio.map((project) => (
              <article key={project.id ?? project.title} className="surface-subtle overflow-hidden">
                {project.image_url ? (
                  <div className="relative aspect-[4/3] bg-muted">
                    <Image
                      src={project.image_url}
                      alt={project.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-muted text-sm text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold tracking-tight">{project.title}</h3>
                  {project.location && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {project.location}
                      {project.completed_year ? ` · ${project.completed_year}` : ""}
                    </p>
                  )}
                  {project.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {profile.google_reviews.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <p className="label-caps">Google reviews</p>
            <Star className="h-4 w-4 text-amber-500" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {profile.google_reviews.map((review) => (
              <blockquote
                key={review.id ?? review.reviewer_name + review.review_text}
                className="surface-subtle p-5"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-medium">{review.reviewer_name}</p>
                  <StarRating rating={review.rating} />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {review.review_text}
                </p>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {profile.product_reviews.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <p className="label-caps">Product reviews</p>
            <Award className="h-4 w-4 text-primary" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {profile.product_reviews.map((review) => (
              <blockquote
                key={review.id ?? review.product_name + review.reviewer_name}
                className="surface-subtle p-5"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="font-medium">{review.product_name}</p>
                  {review.is_verified && (
                    <Badge variant="outline" className="rounded-full text-xs">
                      Verified build
                    </Badge>
                  )}
                </div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    {review.reviewer_name}
                  </p>
                  <StarRating rating={review.rating} />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {review.review_text}
                </p>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
