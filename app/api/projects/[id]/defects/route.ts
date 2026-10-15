import { NextResponse } from "next/server";
import {
  canReportDefect,
  defectCreateSchema,
  DEFECTS_SQL_REQUIRED,
} from "@/lib/defects";
import {
  DEFECT_COLUMNS,
  defectWriteFailure,
  loadDefectActor,
  parseDefectRow,
  readHandoverDefects,
} from "@/lib/defects-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const loaded = await loadDefectActor(id);
  if (!loaded.ok) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  const result = await readHandoverDefects(loaded.actor.supabase, id);
  if (result.unavailable) {
    return NextResponse.json({ error: DEFECTS_SQL_REQUIRED, defects: [] }, { status: 503 });
  }
  if (result.loadError) {
    return NextResponse.json({ error: result.loadError }, { status: 500 });
  }

  return NextResponse.json({ defects: result.defects });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const loaded = await loadDefectActor(id);
  if (!loaded.ok) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  const { actor } = loaded;
  const isProjectBuyer = actor.project.buyer_id === actor.userId;
  if (!canReportDefect(actor.role, isProjectBuyer)) {
    return NextResponse.json(
      { error: "Only the buyer can report a defect." },
      { status: 403 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    json = null;
  }

  const body = defectCreateSchema.safeParse(json);
  if (!body.success) {
    const message = body.error.issues[0]?.message ?? "Invalid defect";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data, error } = await actor.supabase
    .from("project_defects")
    .insert({
      project_id: id,
      author_buyer_id: actor.userId,
      title: body.data.title,
      description: body.data.description,
      status: "open",
    })
    .select(DEFECT_COLUMNS)
    .maybeSingle();

  if (error) {
    const failure = defectWriteFailure(error, "Could not save that defect.");
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Only the buyer can report a defect." },
      { status: 403 }
    );
  }

  const defect = parseDefectRow(data);
  if (!defect) {
    return NextResponse.json(
      { error: "Could not save that defect." },
      { status: 500 }
    );
  }

  return NextResponse.json({ defect });
}
