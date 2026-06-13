"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Eye, Plus, Save, Trash2 } from "lucide-react";
import { BuilderPublicProfileView } from "@/components/builder/BuilderPublicProfileView";
import { StarRatingInput } from "@/components/builder/StarRating";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  BuilderPublicProfile,
  GalleryCategory,
  GalleryImage,
  GoogleReviewHighlight,
  PortfolioProject,
  ProductReview,
} from "@/lib/builder-profile";
import { cn } from "@/lib/utils";

const EMPTY_PORTFOLIO = (): PortfolioProject => ({
  title: "",
  description: "",
  location: "",
  completed_year: null,
  image_url: "",
});

const EMPTY_GOOGLE = (): GoogleReviewHighlight => ({
  reviewer_name: "",
  rating: 5,
  review_text: "",
  reviewed_at: null,
});

const EMPTY_PRODUCT = (): ProductReview => ({
  product_name: "",
  reviewer_name: "",
  rating: 5,
  review_text: "",
  is_verified: false,
});

const EMPTY_GALLERY = (): GalleryImage => ({
  image_url: "",
  caption: "",
  category: "project",
});

export function BuilderProfileEditor() {
  const [profile, setProfile] = useState<BuilderPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/builder/profile");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to load profile.");
      setLoading(false);
      return;
    }
    setProfile(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const payload = {
      ...profile,
      portfolio: profile.portfolio.filter((p) => p.title.trim().length >= 2),
      google_reviews: profile.google_reviews.filter(
        (r) => r.reviewer_name.trim() && r.review_text.trim().length >= 10
      ),
      product_reviews: profile.product_reviews.filter(
        (r) =>
          r.product_name.trim() &&
          r.reviewer_name.trim() &&
          r.review_text.trim().length >= 10
      ),
      gallery: profile.gallery.filter((g) => g.image_url.trim()),
    };

    const res = await fetch("/api/builder/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to save profile.");
      setSaving(false);
      return;
    }

    setProfile(data);
    setSuccess(true);
    setSaving(false);
  }

  function updateField<K extends keyof BuilderPublicProfile>(
    key: K,
    value: BuilderPublicProfile[K]
  ) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading your profile…
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-destructive">
          {error ?? "Profile unavailable."}
        </CardContent>
      </Card>
    );
  }

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setShowPreview(false)}
          >
            Back to editor
          </Button>
          <Link
            href={`/builders/${profile.id}`}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full gap-2")}
            target="_blank"
          >
            <Eye className="h-4 w-4" />
            Open public page
          </Link>
        </div>
        <BuilderPublicProfileView profile={profile} preview />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Build a LinkedIn-style profile buyers can view when comparing builders.
          Use image URLs for photos (direct links to JPG/PNG).
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full gap-2"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button type="submit" disabled={saving} className="rounded-full gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-primary" role="status">
          Profile saved successfully.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
          <CardDescription>
            Company identity and headline shown at the top of your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Your name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Company name</Label>
            <Input
              id="company_name"
              value={profile.company_name ?? ""}
              onChange={(e) => updateField("company_name", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              placeholder="Licensed builder · South West Sydney · Custom homes"
              value={profile.headline ?? ""}
              onChange={(e) => updateField("headline", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bio">About</Label>
            <textarea
              id="bio"
              rows={5}
              value={profile.bio ?? ""}
              onChange={(e) => updateField("bio", e.target.value)}
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Tell buyers about your team, build quality, and areas you service…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar_url">Profile photo URL</Label>
            <Input
              id="avatar_url"
              type="url"
              placeholder="https://…"
              value={profile.avatar_url ?? ""}
              onChange={(e) => updateField("avatar_url", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover_image_url">Cover image URL</Label>
            <Input
              id="cover_image_url"
              type="url"
              placeholder="https://…"
              value={profile.cover_image_url ?? ""}
              onChange={(e) => updateField("cover_image_url", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website_url">Website</Label>
            <Input
              id="website_url"
              type="url"
              placeholder="https://yourbuilder.com.au"
              value={profile.website_url ?? ""}
              onChange={(e) => updateField("website_url", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="years_in_business">Years in business</Label>
            <Input
              id="years_in_business"
              type="number"
              min={0}
              value={profile.years_in_business ?? ""}
              onChange={(e) =>
                updateField(
                  "years_in_business",
                  e.target.value ? Number(e.target.value) : null
                )
              }
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <input
              id="profile_published"
              type="checkbox"
              checked={profile.profile_published}
              onChange={(e) =>
                updateField("profile_published", e.target.checked)
              }
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="profile_published" className="font-normal">
              Publish profile — visible to buyers on Velu
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google reviews summary</CardTitle>
          <CardDescription>
            Add your Google rating and link, then highlight your best reviews below.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="google_rating">Average rating</Label>
            <Input
              id="google_rating"
              type="number"
              min={1}
              max={5}
              step={0.1}
              value={profile.google_rating ?? ""}
              onChange={(e) =>
                updateField(
                  "google_rating",
                  e.target.value ? Number(e.target.value) : null
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="google_review_count">Total review count</Label>
            <Input
              id="google_review_count"
              type="number"
              min={0}
              value={profile.google_review_count}
              onChange={(e) =>
                updateField("google_review_count", Number(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="google_maps_url">Google Maps / Business link</Label>
            <Input
              id="google_maps_url"
              type="url"
              placeholder="https://maps.google.com/…"
              value={profile.google_maps_url ?? ""}
              onChange={(e) => updateField("google_maps_url", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <SectionList
        title="Portfolio projects"
        description="Showcase completed homes and land packages."
        onAdd={() =>
          updateField("portfolio", [...profile.portfolio, EMPTY_PORTFOLIO()])
        }
      >
        {profile.portfolio.map((item, index) => (
          <div key={index} className="surface-subtle space-y-3 p-4">
            <div className="flex justify-between gap-2">
              <p className="text-sm font-medium">Project {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateField(
                    "portfolio",
                    profile.portfolio.filter((_, i) => i !== index)
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Project title"
                value={item.title}
                onChange={(e) => {
                  const next = [...profile.portfolio];
                  next[index] = { ...item, title: e.target.value };
                  updateField("portfolio", next);
                }}
              />
              <Input
                placeholder="Location (e.g. Gregory Hills)"
                value={item.location ?? ""}
                onChange={(e) => {
                  const next = [...profile.portfolio];
                  next[index] = { ...item, location: e.target.value };
                  updateField("portfolio", next);
                }}
              />
              <Input
                type="number"
                placeholder="Completed year"
                value={item.completed_year ?? ""}
                onChange={(e) => {
                  const next = [...profile.portfolio];
                  next[index] = {
                    ...item,
                    completed_year: e.target.value
                      ? Number(e.target.value)
                      : null,
                  };
                  updateField("portfolio", next);
                }}
              />
              <Input
                type="url"
                placeholder="Photo URL"
                value={item.image_url ?? ""}
                onChange={(e) => {
                  const next = [...profile.portfolio];
                  next[index] = { ...item, image_url: e.target.value };
                  updateField("portfolio", next);
                }}
              />
              <textarea
                rows={3}
                placeholder="Description"
                value={item.description ?? ""}
                onChange={(e) => {
                  const next = [...profile.portfolio];
                  next[index] = { ...item, description: e.target.value };
                  updateField("portfolio", next);
                }}
                className="sm:col-span-2 flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        ))}
      </SectionList>

      <SectionList
        title="Google review highlights"
        description="Paste your best Google reviews for buyers to read on Velu."
        onAdd={() =>
          updateField("google_reviews", [
            ...profile.google_reviews,
            EMPTY_GOOGLE(),
          ])
        }
      >
        {profile.google_reviews.map((item, index) => (
          <div key={index} className="surface-subtle space-y-3 p-4">
            <div className="flex justify-between gap-2">
              <StarRatingInput
                value={item.rating}
                onChange={(rating) => {
                  const next = [...profile.google_reviews];
                  next[index] = { ...item, rating };
                  updateField("google_reviews", next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateField(
                    "google_reviews",
                    profile.google_reviews.filter((_, i) => i !== index)
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Reviewer name"
              value={item.reviewer_name}
              onChange={(e) => {
                const next = [...profile.google_reviews];
                next[index] = { ...item, reviewer_name: e.target.value };
                updateField("google_reviews", next);
              }}
            />
            <textarea
              rows={3}
              placeholder="Review text"
              value={item.review_text}
              onChange={(e) => {
                const next = [...profile.google_reviews];
                next[index] = { ...item, review_text: e.target.value };
                updateField("google_reviews", next);
              }}
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        ))}
      </SectionList>

      <SectionList
        title="Product reviews"
        description="Reviews for specific home designs or build packages."
        onAdd={() =>
          updateField("product_reviews", [
            ...profile.product_reviews,
            EMPTY_PRODUCT(),
          ])
        }
      >
        {profile.product_reviews.map((item, index) => (
          <div key={index} className="surface-subtle space-y-3 p-4">
            <div className="flex justify-between gap-2">
              <StarRatingInput
                value={item.rating}
                onChange={(rating) => {
                  const next = [...profile.product_reviews];
                  next[index] = { ...item, rating };
                  updateField("product_reviews", next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateField(
                    "product_reviews",
                    profile.product_reviews.filter((_, i) => i !== index)
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Product / package name"
                value={item.product_name}
                onChange={(e) => {
                  const next = [...profile.product_reviews];
                  next[index] = { ...item, product_name: e.target.value };
                  updateField("product_reviews", next);
                }}
              />
              <Input
                placeholder="Reviewer name"
                value={item.reviewer_name}
                onChange={(e) => {
                  const next = [...profile.product_reviews];
                  next[index] = { ...item, reviewer_name: e.target.value };
                  updateField("product_reviews", next);
                }}
              />
            </div>
            <textarea
              rows={3}
              placeholder="Review text"
              value={item.review_text}
              onChange={(e) => {
                const next = [...profile.product_reviews];
                next[index] = { ...item, review_text: e.target.value };
                updateField("product_reviews", next);
              }}
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.is_verified ?? false}
                onChange={(e) => {
                  const next = [...profile.product_reviews];
                  next[index] = { ...item, is_verified: e.target.checked };
                  updateField("product_reviews", next);
                }}
              />
              Verified Velu build
            </label>
          </div>
        ))}
      </SectionList>

      <SectionList
        title="Photo gallery"
        description="Team, site, and completion photos."
        onAdd={() =>
          updateField("gallery", [...profile.gallery, EMPTY_GALLERY()])
        }
      >
        {profile.gallery.map((item, index) => (
          <div key={index} className="surface-subtle space-y-3 p-4">
            <div className="flex justify-between gap-2">
              <p className="text-sm font-medium">Photo {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateField(
                    "gallery",
                    profile.gallery.filter((_, i) => i !== index)
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="url"
                placeholder="Image URL"
                value={item.image_url}
                onChange={(e) => {
                  const next = [...profile.gallery];
                  next[index] = { ...item, image_url: e.target.value };
                  updateField("gallery", next);
                }}
              />
              <select
                value={item.category}
                onChange={(e) => {
                  const next = [...profile.gallery];
                  next[index] = {
                    ...item,
                    category: e.target.value as GalleryCategory,
                  };
                  updateField("gallery", next);
                }}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="project">Project</option>
                <option value="site">On site</option>
                <option value="completion">Completion</option>
                <option value="team">Team</option>
              </select>
              <Input
                placeholder="Caption"
                value={item.caption ?? ""}
                onChange={(e) => {
                  const next = [...profile.gallery];
                  next[index] = { ...item, caption: e.target.value };
                  updateField("gallery", next);
                }}
                className="sm:col-span-2"
              />
            </div>
          </div>
        ))}
      </SectionList>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="rounded-full gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

function SectionList({
  title,
  description,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full gap-1"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}
