import {
  DEFECTS_SQL_REQUIRED,
  defectsAvailable,
  defectsTableMissing,
  parseProjectDefect,
  type ProjectDefect,
} from "@/lib/defects";
import { createClient } from "@/lib/supabase/server";
import type { ConstructionMilestone } from "@/lib/types";

const DEFECT_COLUMNS =
  "id, project_id, author_buyer_id, title, description, status, builder_completed_at, buyer_approved_at, created_at";

type AppClient = Awaited<ReturnType<typeof createClient>>;

export type DefectProject = {
  id: string;
  buyer_id: string;
  builder_id: string;
  current_stage: ConstructionMilestone;
};

export type DefectActor = {
  supabase: AppClient;
  userId: string;
  role: "buyer" | "builder";
  project: DefectProject;
};

export type DefectLoad = {
  defects: ProjectDefect[];
  unavailable: boolean;
  loadError: string | null;
};

type PostgrestError = { code?: string; message?: string } | null;

export async function readHandoverDefects(
  supabase: AppClient,
  projectId: string
): Promise<DefectLoad> {
  const { data, error } = await supabase
    .from("project_defects")
    .select(DEFECT_COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    return {
      defects: [],
      unavailable: defectsTableMissing(error),
      loadError: defectsTableMissing(error) ? null : "Could not load defects.",
    };
  }

  return {
    defects: (data ?? []).flatMap((row) => {
      const parsed = parseProjectDefect(row);
      return parsed ? [parsed] : [];
    }),
    unavailable: false,
    loadError: null,
  };
}

export async function loadDefectActor(
  projectId: string
): Promise<{ ok: true; actor: DefectActor } | { ok: false; error: string; status: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "buyer" && profile?.role !== "builder") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const { data: project } = await supabase
    .from("construction_projects")
    .select("id, buyer_id, builder_id, current_stage")
    .eq("id", projectId)
    .maybeSingle();

  if (
    !project ||
    (project.buyer_id !== user.id && project.builder_id !== user.id)
  ) {
    return { ok: false, error: "Project not found", status: 404 };
  }

  const stage = project.current_stage as ConstructionMilestone;
  if (!defectsAvailable(stage)) {
    return {
      ok: false,
      error: "Defects are available after handover.",
      status: 409,
    };
  }

  return {
    ok: true,
    actor: {
      supabase,
      userId: user.id,
      role: profile.role,
      project: {
        id: project.id,
        buyer_id: project.buyer_id,
        builder_id: project.builder_id,
        current_stage: stage,
      },
    },
  };
}

export function defectWriteFailure(
  error: PostgrestError,
  fallback: string
): { error: string; status: number } {
  if (defectsTableMissing(error)) {
    return { error: DEFECTS_SQL_REQUIRED, status: 503 };
  }
  return { error: fallback, status: 500 };
}

export function parseDefectRow(row: unknown): ProjectDefect | null {
  return parseProjectDefect(row);
}

export { DEFECT_COLUMNS };
