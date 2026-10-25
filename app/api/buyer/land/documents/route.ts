import { NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeBuildRequirements,
  SITE_DOCUMENT_OPTIONS,
  type SiteDocumentKey,
} from "@/lib/buyer-requirements";
import { createClient } from "@/lib/supabase/server";

const documentKey = z.enum([
  "land_drawings",
  "site_drawings",
  "certificate_10_7",
  "contour_plan",
]);

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function safeFileName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  return cleaned.slice(0, 120) || "document";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "buyer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const listingId = String(form.get("listing_id") ?? "");
  const keyResult = documentKey.safeParse(String(form.get("key") ?? ""));
  const file = form.get("file");

  if (!z.string().uuid().safeParse(listingId).success || !keyResult.success) {
    return NextResponse.json({ error: "Choose a saved block and a document type." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a file to add." }, { status: 400 });
  }
  if (file.size > MAX_BYTES || !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Use a PDF or image up to 10 MB." },
      { status: 400 }
    );
  }

  const { data: listing } = await supabase
    .from("land_listings")
    .select("id")
    .eq("id", listingId)
    .eq("buyer_id", user.id)
    .eq("source", "buyer_owned")
    .maybeSingle();

  if (!listing) {
    return NextResponse.json({ error: "That block is not on your account." }, { status: 404 });
  }

  const key = keyResult.data as SiteDocumentKey;
  const path = `${user.id}/${listingId}/${key}/${safeFileName(file.name)}`;
  const uploaded = await supabase.storage
    .from("buyer-site-documents")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploaded.error) {
    const message = uploaded.error.message.toLowerCase();
    const needsBucket =
      message.includes("bucket") ||
      message.includes("not found") ||
      message.includes("policy") ||
      message.includes("permission");
    return NextResponse.json(
      {
        error: needsBucket
          ? "Document storage is not set up yet. Run migrations/mvp/035_buyer_site_documents.sql in the Supabase SQL Editor. The checklist is still saved."
          : uploaded.error.message,
      },
      { status: 500 }
    );
  }

  const { data: buyer } = await supabase
    .from("buyer_profiles")
    .select("build_requirements")
    .eq("id", user.id)
    .maybeSingle();

  const requirements = normalizeBuildRequirements(buyer?.build_requirements);
  const label = SITE_DOCUMENT_OPTIONS.find((option) => option.key === key)?.label;
  const documents = [
    ...(requirements.site_documents ?? []).filter((item) => item.key !== key),
    { key, file_name: file.name },
  ];

  const { error: saveError } = await supabase.from("buyer_profiles").upsert({
    id: user.id,
    build_requirements: {
      ...requirements,
      site_documents: documents,
    },
  });

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, key, label, file_name: file.name });
}
