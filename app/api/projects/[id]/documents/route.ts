import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 30;
const BUCKET = "build-documents";
const SQL_HINT =
  "Build documents are not set up yet. Paste migrations/mvp/036_build_documents.sql into the Supabase SQL Editor and run it.";

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

function needsSql(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("project_documents") ||
    lower.includes("schema cache") ||
    lower.includes("build-documents") ||
    lower.includes("bucket") ||
    lower.includes("row-level security") ||
    lower.includes("permission denied")
  );
}

async function participantProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  userId: string
) {
  const { data: project } = await supabase
    .from("construction_projects")
    .select("id, buyer_id, builder_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || (project.buyer_id !== userId && project.builder_id !== userId)) {
    return null;
  }
  return project;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await participantProject(supabase, id, user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("project_documents")
    .select("id, file_name, storage_path, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: needsSql(error.message) ? SQL_HINT : error.message },
      { status: 500 }
    );
  }

  const documents = await Promise.all(
    (data ?? []).map(async (row) => {
      const signed = await supabase.storage.from(BUCKET).createSignedUrl(row.storage_path, 60 * 60);
      return {
        id: row.id as string,
        file_name: row.file_name as string,
        created_at: row.created_at as string,
        url: signed.data?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json({ documents });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await participantProject(supabase, id, user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.buyer_id !== user.id) {
    return NextResponse.json({ error: "Only the buyer can add documents to this build." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a file to add." }, { status: 400 });
  }
  if (file.size > MAX_BYTES || !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use a PDF or image up to 10 MB." }, { status: 400 });
  }

  const { count, error: countError } = await supabase
    .from("project_documents")
    .select("id", { count: "exact", head: true })
    .eq("project_id", id);

  if (countError) {
    return NextResponse.json(
      { error: needsSql(countError.message) ? SQL_HINT : countError.message },
      { status: 500 }
    );
  }
  if ((count ?? 0) >= MAX_FILES) {
    return NextResponse.json(
      { error: `This build already has ${MAX_FILES} documents.` },
      { status: 400 }
    );
  }

  const path = `${id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const uploaded = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
  });

  if (uploaded.error) {
    return NextResponse.json(
      { error: needsSql(uploaded.error.message) ? SQL_HINT : uploaded.error.message },
      { status: 500 }
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("project_documents")
    .insert({
      project_id: id,
      uploaded_by: user.id,
      file_name: file.name.slice(0, 180),
      storage_path: path,
    })
    .select("id, file_name, created_at")
    .single();

  if (insertError || !inserted) {
    await supabase.storage.from(BUCKET).remove([path]);
    const message = insertError?.message ?? "Could not save that document.";
    return NextResponse.json(
      { error: needsSql(message) ? SQL_HINT : message },
      { status: 500 }
    );
  }

  const signed = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return NextResponse.json({
    document: {
      id: inserted.id,
      file_name: inserted.file_name,
      created_at: inserted.created_at,
      url: signed.data?.signedUrl ?? null,
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await participantProject(supabase, id, user.id);
  if (!project || project.buyer_id !== user.id) {
    return NextResponse.json({ error: "Only the buyer can remove documents from this build." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    json = null;
  }
  const documentId = z.string().uuid().safeParse(
    json && typeof json === "object" && "id" in json ? (json as { id: unknown }).id : null
  );
  if (!documentId.success) {
    return NextResponse.json({ error: "Choose a document to remove." }, { status: 400 });
  }

  const { data: row, error: readError } = await supabase
    .from("project_documents")
    .select("id, storage_path")
    .eq("id", documentId.data)
    .eq("project_id", id)
    .eq("uploaded_by", user.id)
    .maybeSingle();

  if (readError) {
    return NextResponse.json(
      { error: needsSql(readError.message) ? SQL_HINT : readError.message },
      { status: 500 }
    );
  }
  if (!row) {
    return NextResponse.json({ error: "That document is not on this build." }, { status: 404 });
  }

  const removed = await supabase.storage.from(BUCKET).remove([row.storage_path]);
  if (removed.error && !needsSql(removed.error.message)) {
    return NextResponse.json({ error: removed.error.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("project_documents")
    .delete()
    .eq("id", row.id)
    .eq("project_id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: needsSql(deleteError.message) ? SQL_HINT : deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
