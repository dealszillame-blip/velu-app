import type { BuyerBuildRequirements, LandPurpose } from "@/lib/buyer-requirements";

const START_KEY = "velu.buyerStart";
const DRAFT_KEY = "velu.landDraft";

export type BuyerStartDetails = {
  fullName: string;
  phone: string;
  plotAddress: string;
};

export type LandDraft = {
  address: string;
  landSize: string;
  frontage: string;
  depth: string;
  landValue: string;
  purpose: LandPurpose | "";
  requirementSets: BuyerBuildRequirements[];
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function saveBuyerStart(details: BuyerStartDetails) {
  writeJson(START_KEY, details);
}

export function readBuyerStart(): BuyerStartDetails | null {
  const data = readJson<BuyerStartDetails>(START_KEY);
  if (!data?.fullName?.trim() || !data.phone?.trim() || !data.plotAddress?.trim()) {
    return null;
  }
  return {
    fullName: data.fullName.trim(),
    phone: data.phone.trim(),
    plotAddress: data.plotAddress.trim(),
  };
}

export function saveLandDraft(draft: LandDraft) {
  writeJson(DRAFT_KEY, draft);
}

export function readLandDraft(): LandDraft | null {
  const data = readJson<LandDraft>(DRAFT_KEY);
  if (!data?.address?.trim()) return null;
  return data;
}

export function clearBuyerStart() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(START_KEY);
  window.localStorage.removeItem(DRAFT_KEY);
}
