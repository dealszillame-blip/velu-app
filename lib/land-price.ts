/**
 * Vacant-land price sanity for NSW residential lots.
 * Catches the 10× typo ($740,000 entered as $7,400,000) before it publishes.
 */

export const MAX_RESIDENTIAL_LOT_PRICE_AUD = 4_000_000;
export const MAX_VACANT_LAND_PRICE_PER_SQM = 6_000;
export const MIN_VACANT_LAND_PRICE_PER_SQM = 200;
export const MIN_LISTED_LAND_PRICE_AUD = 50_000;

export type LandPriceCheck = {
  ok: boolean;
  price: number;
  corrected: boolean;
  error?: string;
};

function parseDisplayAmount(display?: string | null): number | null {
  if (!display) return null;
  const match = display.replace(/,/g, "").match(/\$?\s*([\d]+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function looksTenTimesHigh(price: number, landSizeSqm: number): boolean {
  if (!(price > 0) || !(landSizeSqm > 0)) return false;
  const perSqm = price / landSizeSqm;
  const tenth = price / 10;
  const tenthPerSqm = tenth / landSizeSqm;
  return (
    perSqm > MAX_VACANT_LAND_PRICE_PER_SQM &&
    tenth >= MIN_LISTED_LAND_PRICE_AUD &&
    tenthPerSqm >= MIN_VACANT_LAND_PRICE_PER_SQM &&
    tenthPerSqm <= MAX_VACANT_LAND_PRICE_PER_SQM
  );
}

/** Reject a 10× typo on publish. Does not auto-correct user input. */
export function assertPublishableLandPrice(
  price: number,
  landSizeSqm: number,
  label = "Price"
): LandPriceCheck {
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, price, corrected: false, error: `${label} must be a positive amount.` };
  }
  if (price === 0) {
    return { ok: true, price: 0, corrected: false };
  }
  if (price < MIN_LISTED_LAND_PRICE_AUD) {
    return {
      ok: false,
      price,
      corrected: false,
      error: `${label} looks too low for a NSW residential lot. Check for a missing zero.`,
    };
  }
  if (looksTenTimesHigh(price, landSizeSqm) || price > MAX_RESIDENTIAL_LOT_PRICE_AUD) {
    return {
      ok: false,
      price,
      corrected: false,
      error: `${label} looks about 10× too high for this lot size and cannot be published. Check for an extra zero (e.g. $740,000 not $7,400,000).`,
    };
  }
  if (landSizeSqm > 0 && price / landSizeSqm > MAX_VACANT_LAND_PRICE_PER_SQM) {
    return {
      ok: false,
      price,
      corrected: false,
      error: `${label} is above $${MAX_VACANT_LAND_PRICE_PER_SQM.toLocaleString("en-AU")}/m², which is not a realistic vacant-land figure for this lot.`,
    };
  }
  return { ok: true, price, corrected: false };
}

/**
 * Domain / seed ingest: if the numeric price is ~10× the display string or
 * ~10× a sane $/m², correct it. Skip only when it still looks unusable.
 */
export function sanitizeIngestedLandPrice(
  price: number,
  landSizeSqm: number,
  priceDisplay?: string | null
): LandPriceCheck {
  let next = Number.isFinite(price) ? price : 0;
  const fromDisplay = parseDisplayAmount(priceDisplay);

  if (fromDisplay && next > 0 && Math.abs(next / fromDisplay - 10) < 0.05) {
    next = fromDisplay;
  } else if (fromDisplay && next > 0 && Math.abs(fromDisplay / next - 10) < 0.05) {
    next = fromDisplay;
  }

  if (looksTenTimesHigh(next, landSizeSqm)) {
    next = next / 10;
  }

  const publish = assertPublishableLandPrice(next, landSizeSqm);
  if (!publish.ok && next === 0) {
    return { ok: true, price: 0, corrected: false };
  }
  return {
    ok: publish.ok,
    price: next,
    corrected: next !== price,
    error: publish.error,
  };
}
