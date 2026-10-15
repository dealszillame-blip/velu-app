import { NextResponse } from "next/server";
import {
  defectActionError,
  defectActionSchema,
  defectExpectedStatus,
  defectStatusPatch,
} from "@/lib/defects";
import {
  DEFECT_COLUMNS,
  defectWriteFailure,
  loadDefectActor,
  parseDefectRow,
} from "@/lib/defects-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; defectId: string }> }
) {
  const { id, defectId } = await params;
  const loaded = await loadDefectActor(id);
  if (!loaded.ok) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    json = null;
  }

  const body = defectActionSchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json(
      { error: "Choose mark fixed, approve, or not fixed." },
      { status: 400 }
    );
  }

  const { actor } = loaded;
  const { data: existing, error: readError } = await actor.supabase
    .from("project_defects")
    .select(DEFECT_COLUMNS)
    .eq("id", defectId)
    .eq("project_id", id)
    .maybeSingle();

  if (readError) {
    const failure = defectWriteFailure(readError, "Could not load that defect.");
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }

  const current = parseDefectRow(existing);
  if (!current) {
    return NextResponse.json({ error: "Defect not found." }, { status: 404 });
  }

  const actionError = defectActionError({
    role: actor.role,
    isProjectBuyer: actor.project.buyer_id === actor.userId,
    isProjectBuilder: actor.project.builder_id === actor.userId,
    status: current.status,
    action: body.data.action,
  });
  if (actionError) {
    return NextResponse.json(
      { error: actionError.error },
      { status: actionError.status }
    );
  }

  const { data, error } = await actor.supabase
    .from("project_defects")
    .update(defectStatusPatch(body.data.action, new Date().toISOString()))
    .eq("id", defectId)
    .eq("project_id", id)
    .eq("status", defectExpectedStatus(body.data.action))
    .select(DEFECT_COLUMNS)
    .maybeSingle();

  if (error) {
    const failure = defectWriteFailure(error, "Could not update that defect.");
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }

  const defect = parseDefectRow(data);
  if (!defect) {
    return NextResponse.json(
      { error: "That defect has already changed. Refresh and try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({ defect });
}
