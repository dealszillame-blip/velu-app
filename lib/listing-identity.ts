/** Normalize street addresses so "12 Chalford Circuit" and "12 Chalford Cct, Ingleburn" collide. */
export function normalizeListingAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/\b(street|st)\b/g, "st")
    .replace(/\b(road|rd)\b/g, "rd")
    .replace(/\b(avenue|ave)\b/g, "ave")
    .replace(/\b(drive|dr)\b/g, "dr")
    .replace(/\b(boulevard|blvd)\b/g, "blvd")
    .replace(/\b(circuit|cct|circ)\b/g, "cct")
    .replace(/\b(place|pl)\b/g, "pl")
    .replace(/\b(court|ct)\b/g, "ct")
    .replace(/\b(crescent|cres)\b/g, "cres")
    .replace(/\b(lane|ln)\b/g, "ln")
    .replace(/\b(nsw|australia)\b/g, " ")
    .replace(/\b\d{4}\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function listingDedupeKey(input: {
  address: string;
  suburb?: string | null;
  buyer_id?: string | null;
}): string {
  const suburb = (input.suburb ?? "").toLowerCase().trim();
  let address = normalizeListingAddress(input.address);
  if (suburb) {
    address = address.replace(new RegExp(`\\b${suburb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), "");
  }
  address = address.replace(/\s+/g, " ").trim();
  const buyer = input.buyer_id ?? "_";
  return `${address}|${suburb}|${buyer}`;
}

type LeadLike = {
  id: string;
  address: string;
  suburb?: string | null;
  buyer_id?: string | null;
  source?: string | null;
  price?: number | null;
  sold_at?: string | null;
  land_size_sqm?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  proposal_count?: number | null;
  site_reports?: unknown[] | null;
};

function saneScore(lead: LeadLike): number {
  const price = Number(lead.price) || 0;
  const size = Number(lead.land_size_sqm) || 0;
  const perSqm = size > 0 && price > 0 ? price / size : 0;
  let score = 0;
  if (lead.source === "buyer_owned") score += 4;
  if (perSqm >= 200 && perSqm <= 6000) score += 3;
  else if (price > 4_000_000) score -= 5;
  if (lead.sold_at) score += 1;
  return score;
}

/** Keep one lead per address + buyer. Prefer buyer-owned and a sane (not 10×) price. */
export function dedupeLeads<T extends LeadLike>(leads: T[]): T[] {
  const chosen = new Map<string, T>();
  for (const lead of leads) {
    const key = listingDedupeKey(lead);
    const existing = chosen.get(key);
    if (!existing) {
      chosen.set(key, lead);
      continue;
    }
    const nextScore = saneScore(lead);
    const prevScore = saneScore(existing);
    if (nextScore > prevScore) {
      chosen.set(key, lead);
      continue;
    }
    if (nextScore === prevScore) {
      const nextSold = lead.sold_at ? Date.parse(lead.sold_at) : 0;
      const prevSold = existing.sold_at ? Date.parse(existing.sold_at) : 0;
      if (nextSold >= prevSold) chosen.set(key, lead);
    }
  }
  return [...chosen.values()];
}

function ownedCompleteness(row: LeadLike): number {
  return (
    saneScore(row) +
    Math.min(Number(row.proposal_count) || 0, 5) +
    Math.min(row.site_reports?.length ?? 0, 5)
  );
}

function recencyMs(row: LeadLike): number {
  return (
    Date.parse(row.updated_at ?? "") ||
    Date.parse(row.created_at ?? "") ||
    Date.parse(row.sold_at ?? "") ||
    0
  );
}

/**
 * My land: one card per buyer + normalized address (Circuit/Cct).
 * Equivalent of DISTINCT ON so duplicate Chalford copies cannot render
 * even before migration 029 deletes the extra rows.
 */
export function dedupeOwnedListings<T extends LeadLike>(listings: T[]): T[] {
  const chosen = new Map<string, T>();
  for (const listing of listings) {
    const key = listingDedupeKey(listing);
    const existing = chosen.get(key);
    if (!existing) {
      chosen.set(key, listing);
      continue;
    }
    const nextScore = ownedCompleteness(listing);
    const prevScore = ownedCompleteness(existing);
    if (nextScore > prevScore) {
      chosen.set(key, listing);
      continue;
    }
    if (nextScore === prevScore && recencyMs(listing) >= recencyMs(existing)) {
      chosen.set(key, listing);
    }
  }
  return [...chosen.values()].sort(
    (a, b) => Date.parse(String(b.created_at ?? "")) - Date.parse(String(a.created_at ?? ""))
  );
}
