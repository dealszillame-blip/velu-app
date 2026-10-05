/**
 * Offline checks for the 1 Oct 2026 NOW punch list.
 * Usage: ./node_modules/.bin/tsx scripts/verify-audit-fixes.ts
 */

import {
  notesIndicateSingleLevel,
  shouldPenaliseStoreyMismatch,
  storeyBriefContradiction,
  type BuyerBuildRequirements,
} from "../lib/buyer-requirements";
import { isPlaceholderDirectoryBuilder } from "../lib/placeholder-builders";
import { assertPublishableLandPrice, sanitizeIngestedLandPrice } from "../lib/land-price";
import { dedupeLeads, listingDedupeKey } from "../lib/listing-identity";
import { recommendProposals } from "../lib/proposal-recommendation";
import { NSW_STATUTORY_WARRANTY } from "../lib/statutory-warranty";
import { DEMO_BUYER_OWNED_LAND, DEMO_USERS } from "./demo-listings-data";
import { DEMO_COMPARISON_TEMPLATES } from "../lib/demo-proposals";
import type { ProposalRow } from "../lib/proposals";

function assert(cond: unknown, message: string) {
  if (!cond) {
    throw new Error(message);
  }
}

const figtree = DEMO_BUYER_OWNED_LAND.find((p) => p.address === "8 Figtree Blvd");
assert(figtree, "Figtree seed missing");
assert(figtree!.landSizeSqm === 518, `Figtree size ${figtree!.landSizeSqm} !== 518`);
assert(figtree!.frontageMeters === 13.5, `Figtree frontage ${figtree!.frontageMeters} !== 13.5`);
assert(figtree!.depthMeters === 20, `Figtree depth ${figtree!.depthMeters} !== 20`);

const tenX = assertPublishableLandPrice(7_400_000, 518);
assert(!tenX.ok, "7.4M on 518m² must not publish");

const sane = assertPublishableLandPrice(740_000, 518);
assert(sane.ok, "740k on 518m² should publish");

const ingested = sanitizeIngestedLandPrice(7_400_000, 518, "$740,000");
assert(ingested.ok && ingested.price === 740_000, "Domain 10× should correct to display price");

const dupes = dedupeLeads([
  {
    id: "a",
    address: "12 Chalford Circuit, Ingleburn NSW 2565",
    suburb: "Ingleburn",
    buyer_id: "buyer-1",
    source: "buyer_owned",
    price: 740_000,
    land_size_sqm: 518,
    sold_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "b",
    address: "12 Chalford Cct",
    suburb: "Ingleburn",
    buyer_id: "buyer-1",
    source: "domain",
    price: 7_400_000,
    land_size_sqm: 518,
    sold_at: "2026-09-02T00:00:00.000Z",
  },
]);
assert(dupes.length === 1, `expected 1 Chalford lead, got ${dupes.length}`);
assert(dupes[0].price === 740_000, "dedupe should keep the sane price");
assert(
  listingDedupeKey({
    address: "12 Chalford Circuit, Ingleburn",
    suburb: "Ingleburn",
    buyer_id: "buyer-1",
  }) ===
    listingDedupeKey({
      address: "12 Chalford Cct",
      suburb: "Ingleburn",
      buyer_id: "buyer-1",
    }),
  "Chalford Circuit / Cct should share a key"
);

assert(
  isPlaceholderDirectoryBuilder({
    license_number: "AAAAA",
    company_name: "UUU",
  }),
  "UUU / AAAAA must be filtered"
);
assert(
  !isPlaceholderDirectoryBuilder({
    license_number: "369795C",
    company_name: "Dhursan Homes Pty Ltd",
  }),
  "real NSW licence must not be filtered"
);

const contradictory: BuyerBuildRequirements = {
  storeys: "ground_plus_one",
  house_type: "double_storey",
  granny_flat: "yes",
  bedrooms: 5,
  bathrooms: 3,
  additional_notes: "Single-level living, granny flat for parents.",
};
assert(notesIndicateSingleLevel(contradictory.additional_notes), "notes should read as single-level");
assert(storeyBriefContradiction(contradictory), "structured G+1 vs single-level notes must warn");
assert(
  !shouldPenaliseStoreyMismatch(contradictory, 1),
  "1-storey package must not be penalised when notes say single-level"
);

const consistent: BuyerBuildRequirements = {
  storeys: "ground_only",
  house_type: "single_storey",
  granny_flat: "yes",
  bedrooms: 5,
  bathrooms: 3,
  additional_notes: "Single-level living, granny flat for parents.",
};
assert(!storeyBriefContradiction(consistent), "demo.buyer2 seed must be internally consistent");

const proposals: ProposalRow[] = DEMO_COMPARISON_TEMPLATES.map((template, index) => ({
  id: `p-${index}`,
  builder_id: `b-${index}`,
  builder_name: template.package_name.includes("Campbell")
    ? "Apex Homes Pty Ltd"
    : template.package_name.includes("Hawkesbury")
      ? "SouthWest Living"
      : "Meridian Building Co",
  land_listing_id: "listing",
  package_name: template.package_name,
  base_price: template.base_price,
  inclusions: template.inclusions,
  estimated_build_weeks: template.estimated_build_weeks,
  notes: template.notes,
  home_specs: template.home_specs,
  inclusion_items: template.inclusion_items,
  price_breakdown: template.price_breakdown,
  status: "pending",
  created_at: new Date().toISOString(),
}));

const againstContradiction = recommendProposals(proposals, contradictory);
assert(
  againstContradiction.ranked.every((row) => !row.storey_mismatch || !row.package_name.includes("Single")),
  "single-storey packages should not be marked storey_mismatch against single-level notes"
);
const singleStorey = againstContradiction.ranked.find((row) => row.package_name.includes("Single"));
assert(singleStorey && !singleStorey.storey_mismatch, "Oran Park Single + Studio must not be a hard storey fail");

const lastSales = DEMO_USERS.filter((u) => u.role === "builder").map((u) => ({
  name: u.companyName,
  last: u.lastSoldAddress,
  delay: u.avgDelayWeeks,
}));
const saleSet = new Set(lastSales.map((row) => `${row.last}|${row.delay}`));
assert(saleSet.size === lastSales.length, `demo builders still share last-sale/delay: ${JSON.stringify(lastSales)}`);
assert(
  lastSales.every((row) => row.last !== "7 Wattle Grove, Leumeah"),
  "Wattle Grove placeholder last-sale must not remain on demo builders"
);

assert(/6 years/.test(NSW_STATUTORY_WARRANTY) && /2 years/.test(NSW_STATUTORY_WARRANTY), "statutory copy");

console.log("✓ audit NOW punch list checks passed");
console.log(`  Figtree: ${figtree!.landSizeSqm}m² / ${figtree!.frontageMeters}m / ${figtree!.depthMeters}m`);
console.log(`  10× reject: ${tenX.error}`);
console.log(`  Chalford deduped to $${dupes[0].price.toLocaleString("en-AU")}`);
console.log(`  Recommend (contradictory brief) top: ${againstContradiction.recommended?.package_name} (${againstContradiction.recommended?.score})`);
