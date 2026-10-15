import { z } from "zod";
import { isBuildComplete } from "@/lib/milestones";
import type { ConstructionMilestone } from "@/lib/types";

export const DEFECT_TITLE_MIN = 2;
export const DEFECT_TITLE_MAX = 80;
export const DEFECT_DESCRIPTION_MIN = 2;
export const DEFECT_DESCRIPTION_MAX = 2000;

export const DEFECT_STATUSES = [
  "open",
  "completed_by_builder",
  "approved",
] as const;

export type DefectStatus = (typeof DEFECT_STATUSES)[number];

export const DEFECT_ACTIONS = ["complete", "approve", "reopen"] as const;

export type DefectAction = (typeof DEFECT_ACTIONS)[number];

export type DefectRole = "buyer" | "builder";

export type ProjectDefect = {
  id: string;
  project_id: string;
  author_buyer_id: string;
  title: string;
  description: string;
  status: DefectStatus;
  builder_completed_at: string | null;
  buyer_approved_at: string | null;
  created_at: string;
};

export const DEFECTS_SQL_REQUIRED =
  "Defects are not saved yet. Paste migrations/mvp/032_defects.sql into the Supabase SQL Editor and run it.";

const STATUS_SET = new Set<string>(DEFECT_STATUSES);

/** Defects and the warranty note show only at Handover, when the build is finished. */
export function defectsAvailable(stage: ConstructionMilestone): boolean {
  return isBuildComplete(stage);
}

export const defectCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(DEFECT_TITLE_MIN, "Title needs at least 2 characters.")
    .max(DEFECT_TITLE_MAX, "Title must be 80 characters or fewer.")
    .refine((value) => !/[\r\n]/.test(value), "Keep the title on one line."),
  description: z
    .string()
    .trim()
    .min(DEFECT_DESCRIPTION_MIN, "Add a short description.")
    .max(DEFECT_DESCRIPTION_MAX, "Description must be 2000 characters or fewer."),
});

export const defectActionSchema = z.object({
  action: z.enum(DEFECT_ACTIONS),
});

export function parseProjectDefect(row: unknown): ProjectDefect | null {
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  const status = record.status;
  if (
    typeof record.id !== "string" ||
    typeof record.project_id !== "string" ||
    typeof record.author_buyer_id !== "string" ||
    typeof record.title !== "string" ||
    typeof record.description !== "string" ||
    typeof status !== "string" ||
    !STATUS_SET.has(status)
  ) {
    return null;
  }

  return {
    id: record.id,
    project_id: record.project_id,
    author_buyer_id: record.author_buyer_id,
    title: record.title,
    description: record.description,
    status: status as DefectStatus,
    builder_completed_at:
      typeof record.builder_completed_at === "string"
        ? record.builder_completed_at
        : null,
    buyer_approved_at:
      typeof record.buyer_approved_at === "string" ? record.buyer_approved_at : null,
    created_at:
      typeof record.created_at === "string"
        ? record.created_at
        : new Date(0).toISOString(),
  };
}

export function defectsTableMissing(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("project_defects") &&
    (message.includes("does not exist") || message.includes("schema cache"))
  );
}

export function groupDefects(defects: readonly ProjectDefect[]) {
  return {
    open: defects.filter((defect) => defect.status === "open"),
    waiting: defects.filter((defect) => defect.status === "completed_by_builder"),
    approved: defects.filter((defect) => defect.status === "approved"),
  };
}

export function defectGroupTitle(
  group: "open" | "waiting" | "approved",
  role: DefectRole
): string {
  if (group === "open") return "Open";
  if (group === "approved") return "Approved";
  return role === "buyer" ? "Waiting for your approval" : "Waiting for the buyer";
}

export function defectActionsFor(
  role: DefectRole,
  status: DefectStatus
): DefectAction[] {
  if (role === "builder" && status === "open") return ["complete"];
  if (role === "buyer" && status === "completed_by_builder") {
    return ["approve", "reopen"];
  }
  return [];
}

export function canReportDefect(role: DefectRole, isProjectBuyer: boolean): boolean {
  return role === "buyer" && isProjectBuyer;
}

export function defectActionError(input: {
  role: DefectRole;
  isProjectBuyer: boolean;
  isProjectBuilder: boolean;
  status: DefectStatus;
  action: DefectAction;
}): { error: string; status: number } | null {
  if (input.action === "complete") {
    if (input.role !== "builder" || !input.isProjectBuilder) {
      return {
        error: "The builder marks a defect fixed. You cannot mark it complete.",
        status: 403,
      };
    }
    if (input.status !== "open") {
      return { error: "Only an open defect can be marked fixed.", status: 409 };
    }
    return null;
  }

  if (input.role !== "buyer" || !input.isProjectBuyer) {
    return {
      error:
        input.action === "approve"
          ? "The buyer approves a defect. You cannot approve it."
          : "Only the buyer can send a defect back.",
      status: 403,
    };
  }

  if (input.status !== "completed_by_builder") {
    return {
      error: "Approve a defect, or send it back, only after the builder marks it fixed.",
      status: 409,
    };
  }

  return null;
}

export function defectStatusPatch(
  action: DefectAction,
  now: string
): {
  status: DefectStatus;
  builder_completed_at?: string | null;
  buyer_approved_at?: string | null;
} {
  if (action === "complete") {
    return {
      status: "completed_by_builder",
      builder_completed_at: now,
      buyer_approved_at: null,
    };
  }
  if (action === "approve") {
    return {
      status: "approved",
      buyer_approved_at: now,
    };
  }
  return {
    status: "open",
    builder_completed_at: null,
    buyer_approved_at: null,
  };
}

export function defectExpectedStatus(action: DefectAction): DefectStatus {
  return action === "complete" ? "open" : "completed_by_builder";
}

export function formatAuDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Sydney",
  });
}
