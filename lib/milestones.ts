import {
  CONSTRUCTION_STAGES,
  type ConstructionMilestone,
} from "@/lib/types";

export type MilestoneVisualState = "done" | "current" | "upcoming";

export function isBuildComplete(stage: ConstructionMilestone): boolean {
  return stage === "completion";
}

export function milestoneVisualState(
  stage: ConstructionMilestone,
  current: ConstructionMilestone
): MilestoneVisualState {
  if (isBuildComplete(current)) return "done";
  const currentIndex = CONSTRUCTION_STAGES.indexOf(current);
  const index = CONSTRUCTION_STAGES.indexOf(stage);
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "current";
  return "upcoming";
}

export function milestoneProgress(current: ConstructionMilestone): {
  index: number;
  percent: number;
  remaining: number;
  complete: boolean;
} {
  const index = Math.max(0, CONSTRUCTION_STAGES.indexOf(current));
  const complete = isBuildComplete(current);
  return {
    index,
    percent: Math.round(((index + 1) / CONSTRUCTION_STAGES.length) * 100),
    remaining: complete ? 0 : CONSTRUCTION_STAGES.length - index - 1,
    complete,
  };
}

export function nextMilestone(
  current: ConstructionMilestone
): ConstructionMilestone | null {
  if (isBuildComplete(current)) return null;
  const index = CONSTRUCTION_STAGES.indexOf(current);
  return CONSTRUCTION_STAGES[index + 1] ?? null;
}

/** Builder company, otherwise the person's name. Never a role placeholder. */
export function projectPartyName(
  profile:
    | { full_name?: string | null; company_name?: string | null }
    | null
    | undefined,
  role: "buyer" | "builder"
): string | null {
  const company = profile?.company_name?.trim() ?? "";
  const full = profile?.full_name?.trim() ?? "";
  if (role === "builder") return company || full || null;
  return full || null;
}
