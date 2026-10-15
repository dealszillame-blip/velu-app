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
  if (index < 0) return null;
  return CONSTRUCTION_STAGES[index + 1] ?? null;
}

/** Buyer timeline: done trail, the open stage, the locked next stage, and a count of the rest. */
export function buyerMilestoneFocus(current: ConstructionMilestone): {
  complete: boolean;
  done: ConstructionMilestone[];
  current: ConstructionMilestone | null;
  next: ConstructionMilestone | null;
  laterCount: number;
} {
  if (isBuildComplete(current)) {
    return {
      complete: true,
      done: [...CONSTRUCTION_STAGES],
      current: null,
      next: null,
      laterCount: 0,
    };
  }

  const index = CONSTRUCTION_STAGES.indexOf(current);
  if (index < 0) {
    return {
      complete: false,
      done: [],
      current: null,
      next: null,
      laterCount: 0,
    };
  }
  const next = CONSTRUCTION_STAGES[index + 1] ?? null;

  return {
    complete: false,
    done: CONSTRUCTION_STAGES.slice(0, index),
    current: CONSTRUCTION_STAGES[index],
    next,
    laterCount: CONSTRUCTION_STAGES.length - index - 1 - (next ? 1 : 0),
  };
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
