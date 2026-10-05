/**
 * Offline checks for Phase 1 quotes / brief / soil / login home.
 * Usage: ./node_modules/.bin/tsx scripts/verify-phase1.ts
 */

import {
  getPostLoginPath,
  isGenericHomePath,
  sanitizeNextPath,
} from "../lib/auth-redirect";
import {
  applyNotesToStoreys,
  applyStoreysAsSourceOfTruth,
  briefSaveBlocked,
  storeyBriefContradiction,
  type BuyerBuildRequirements,
} from "../lib/buyer-requirements";
import { DEMO_COMPARISON_TEMPLATES } from "../lib/demo-proposals";
import { canEditProposal } from "../lib/proposals";
import { defaultLineKind } from "../lib/quote-structure";
import {
  isSoilReportDelivered,
  siteCostsAreProvisional,
} from "../lib/soil-sequencing";
import { ROLE_HOME } from "../lib/types";

function assert(cond: unknown, message: string) {
  if (!cond) {
    throw new Error(message);
  }
}

assert(isGenericHomePath("/"), "slash is generic home");
assert(isGenericHomePath(""), "empty is generic home");
assert(!isGenericHomePath("/builder/dashboard"), "dashboard is a real next");
assert(sanitizeNextPath("//evil.com") === null, "protocol-relative next rejected");
assert(sanitizeNextPath("https://evil.com") === null, "absolute next rejected");
assert(sanitizeNextPath("/buyer/my-land") === "/buyer/my-land", "relative next kept");

const builderHome = getPostLoginPath(new URLSearchParams("next=/"), "builder");
assert(
  builderHome === ROLE_HOME.builder,
  `next=/ for builder must be ${ROLE_HOME.builder}, got ${builderHome}`
);
assert(
  getPostLoginPath(new URLSearchParams(), "builder") === "/builder/dashboard",
  "missing next uses builder dashboard"
);
assert(
  getPostLoginPath(new URLSearchParams("next=/builder/leads"), "builder") ===
    "/builder/leads",
  "explicit next is honoured"
);

assert(canEditProposal("pending") && canEditProposal("viewed"), "pending/viewed editable");
assert(!canEditProposal("accepted"), "accepted not editable");
assert(!canEditProposal("withdrawn"), "withdrawn not editable");

assert(defaultLineKind("site") === "allowance", "site lines are allowances");
assert(defaultLineKind("pc") === "pc", "pc category");
assert(defaultLineKind("base") === "lump_sum", "base is lump sum");

for (const template of DEMO_COMPARISON_TEMPLATES) {
  assert(
    template.contract_type === "fixed_price" ||
      template.contract_type === "cost_plus" ||
      template.contract_type === "hybrid",
    `${template.package_name} missing contract_type`
  );
  assert(
    /estimate/i.test(template.notes),
    `${template.package_name} demo notes must say estimate`
  );
  const site = template.price_breakdown.find((line) => line.category === "site");
  assert(site?.provisional, `${template.package_name} site line must be provisional`);
  assert(/est/i.test(site?.label ?? ""), `${template.package_name} site label is an estimate`);
}

const contradictory: BuyerBuildRequirements = {
  storeys: "ground_plus_one",
  house_type: "double_storey",
  granny_flat: "yes",
  bedrooms: 5,
  bathrooms: 3,
  additional_notes: "Single-level living, granny flat for parents.",
};
assert(storeyBriefContradiction(contradictory), "contradiction detected");
assert(briefSaveBlocked(contradictory), "save blocked until resolve/confirm");
assert(
  !briefSaveBlocked({ ...contradictory, brief_contradiction_acknowledged: true }),
  "confirm allows save"
);
const matchedNotes = applyNotesToStoreys(contradictory);
assert(matchedNotes.storeys === "ground_only", "match notes sets ground_only");
assert(!briefSaveBlocked(matchedNotes), "resolved notes can save");
const keepStoreys = applyStoreysAsSourceOfTruth(contradictory);
assert(keepStoreys.house_type !== "single_storey" || keepStoreys.storeys !== "ground_only", "keep storeys");

assert(
  siteCostsAreProvisional([{ report_definition_key: "soil_report", status: "quoted" }]),
  "quoted soil is still provisional"
);
assert(
  isSoilReportDelivered([{ report_definition_key: "soil_report", status: "delivered" }]),
  "delivered soil is final"
);
assert(
  siteCostsAreProvisional([]),
  "no soil request means provisional site $"
);

console.log("verify-phase1: ok");
