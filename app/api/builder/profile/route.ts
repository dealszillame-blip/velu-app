import { NextResponse } from "next/server";
import { z } from "zod";
import type { BuilderPublicProfile } from "@/lib/builder-profile";
import { createClient } from "@/lib/supabase/server";

const portfolioSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  location: z.string().optional(),
  completed_year: z.number().int().min(1980).max(2100).nullable().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  sort_order: z.number().int().optional(),
});

const googleReviewSchema = z.object({
  reviewer_name: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().min(10),
  reviewed_at: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
});

const productReviewSchema = z.object({
  product_name: z.string().min(2),
  reviewer_name: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().min(10),
  reviewed_at: z.string().nullable().optional(),
  is_verified: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

const gallerySchema = z.object({
  image_url: z.string().url(),
  caption: z.string().optional(),
  category: z.enum(["project", "team", "site", "completion"]).default("project"),
  sort_order: z.number().int().optional(),
});

const updateSchema = z.object({
  full_name: z.string().min(2).optional(),
  company_name: z.string().min(2).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")).nullable(),
  headline: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  cover_image_url: z.string().url().optional().or(z.literal("")).nullable(),
  google_maps_url: z.string().url().optional().or(z.literal("")).nullable(),
  google_rating: z.number().min(1).max(5).nullable().optional(),
  google_review_count: z.number().int().min(0).optional(),
  website_url: z.string().url().optional().or(z.literal("")).nullable(),
  years_in_business: z.number().int().min(0).max(150).nullable().optional(),
  profile_published: z.boolean().optional(),
  portfolio: z.array(portfolioSchema).optional(),
  google_reviews: z.array(googleReviewSchema).optional(),
  product_reviews: z.array(productReviewSchema).optional(),
  gallery: z.array(gallerySchema).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("get_builder_public_profile", {
    p_builder_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Complete builder onboarding first." },
      { status: 404 }
    );
  }

  return NextResponse.json(data as BuilderPublicProfile);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = updateSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { data: roleCheck } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (roleCheck?.role !== "builder") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.data.full_name || body.data.company_name || body.data.avatar_url !== undefined) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        ...(body.data.full_name ? { full_name: body.data.full_name } : {}),
        ...(body.data.company_name ? { company_name: body.data.company_name } : {}),
        ...(body.data.avatar_url !== undefined
          ? { avatar_url: body.data.avatar_url || null }
          : {}),
      })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  const builderUpdate: Record<string, unknown> = {};
  for (const key of [
    "headline",
    "bio",
    "cover_image_url",
    "google_maps_url",
    "google_rating",
    "google_review_count",
    "website_url",
    "years_in_business",
    "profile_published",
  ] as const) {
    if (body.data[key] !== undefined) {
      const value = body.data[key];
      builderUpdate[key] =
        typeof value === "string" && value === "" ? null : value;
    }
  }

  if (Object.keys(builderUpdate).length > 0) {
    const { error: builderError } = await supabase
      .from("builder_profiles")
      .update(builderUpdate)
      .eq("id", user.id);

    if (builderError) {
      return NextResponse.json({ error: builderError.message }, { status: 500 });
    }
  }

  if (body.data.portfolio !== undefined) {
    await supabase
      .from("builder_portfolio_projects")
      .delete()
      .eq("builder_id", user.id);

    if (body.data.portfolio.length > 0) {
      const { error } = await supabase.from("builder_portfolio_projects").insert(
        body.data.portfolio.map((item, index) => ({
          builder_id: user.id,
          title: item.title,
          description: item.description || null,
          location: item.location || null,
          completed_year: item.completed_year ?? null,
          image_url: item.image_url || null,
          sort_order: item.sort_order ?? index,
        }))
      );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  if (body.data.google_reviews !== undefined) {
    await supabase
      .from("builder_google_review_highlights")
      .delete()
      .eq("builder_id", user.id);

    if (body.data.google_reviews.length > 0) {
      const { error } = await supabase
        .from("builder_google_review_highlights")
        .insert(
          body.data.google_reviews.map((item, index) => ({
            builder_id: user.id,
            reviewer_name: item.reviewer_name,
            rating: item.rating,
            review_text: item.review_text,
            reviewed_at: item.reviewed_at || null,
            sort_order: item.sort_order ?? index,
          }))
        );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  if (body.data.product_reviews !== undefined) {
    await supabase
      .from("builder_product_reviews")
      .delete()
      .eq("builder_id", user.id);

    if (body.data.product_reviews.length > 0) {
      const { error } = await supabase.from("builder_product_reviews").insert(
        body.data.product_reviews.map((item, index) => ({
          builder_id: user.id,
          product_name: item.product_name,
          reviewer_name: item.reviewer_name,
          rating: item.rating,
          review_text: item.review_text,
          reviewed_at: item.reviewed_at || null,
          is_verified: item.is_verified ?? false,
          sort_order: item.sort_order ?? index,
        }))
      );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  if (body.data.gallery !== undefined) {
    await supabase
      .from("builder_gallery_images")
      .delete()
      .eq("builder_id", user.id);

    if (body.data.gallery.length > 0) {
      const { error } = await supabase.from("builder_gallery_images").insert(
        body.data.gallery.map((item, index) => ({
          builder_id: user.id,
          image_url: item.image_url,
          caption: item.caption || null,
          category: item.category,
          sort_order: item.sort_order ?? index,
        }))
      );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  const { data, error } = await supabase.rpc("get_builder_public_profile", {
    p_builder_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as BuilderPublicProfile);
}
