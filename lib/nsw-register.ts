/**
 * NSW Fair Trading public register (the same API Verify NSW uses in the browser).
 * These records are licensed contractors, not Velu-onboarded users.
 */

export const NSW_TRADES_ADV_QUERY =
  "https://verify.licence.nsw.gov.au/publicregisterapi/api/v1/licence/search/advQuery";

export const NSW_BUILDER_CLASS = {
  classCode: ["HBS_CON_Builder"],
  licenceTypes: ["Contractor Licence"],
} as const;

const SYDNEY_POSTCODE_RANGES: Array<[number, number]> = [
  [2000, 2234],
  [2555, 2579],
  [2140, 2179],
  [2745, 2780],
];

export type NswRegisterBuilder = {
  licence_id: string | null;
  licence_number: string;
  licence_type: string | null;
  status: string | null;
  granted: string | null;
  expires: string | null;
  licensee: string;
  licensee_type: string | null;
  suburb: string;
  state: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  abn: string | null;
  acn: string | null;
  verify_url: string;
};

type AdvResult = {
  pagingInfo?: {
    currentPage?: number;
    totalPages?: number;
    totalRecords?: number;
    totalRecordsLimitExceeded?: boolean;
  };
  results?: Array<Record<string, unknown>>;
};

function isSydneyPostcode(postcode: string): boolean {
  const n = Number(postcode);
  if (!Number.isFinite(n)) return false;
  return SYDNEY_POSTCODE_RANGES.some(([from, to]) => n >= from && n <= to);
}

export function isGreaterSydneyBuilder(row: {
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  state?: string | null;
}): boolean {
  if ((row.state ?? "NSW") !== "NSW") return false;
  if (row.postcode && isSydneyPostcode(row.postcode)) return true;
  const lat = row.latitude;
  const lng = row.longitude;
  if (lat == null || lng == null) return false;
  return lat >= -34.35 && lat <= -33.55 && lng >= 150.55 && lng <= 151.35;
}

export function verifyNswUrl(licenceNumber: string): string {
  return `https://verify.licence.nsw.gov.au/results?searchTerm=${encodeURIComponent(licenceNumber)}&filter=search&status=all`;
}

function mapRegisterRow(
  row: Record<string, unknown>,
  requireSydney: boolean
): NswRegisterBuilder | null {
  const licence_number = String(row.licenceNumber ?? "").trim();
  const licensee = String(row.licensee ?? "").trim();
  if (!licence_number || !licensee) return null;

  const latitude =
    typeof row.latitude === "number" ? row.latitude : Number(row.latitude);
  const longitude =
    typeof row.longitude === "number" ? row.longitude : Number(row.longitude);

  const mapped: NswRegisterBuilder = {
    licence_id: row.licenceId ? String(row.licenceId) : null,
    licence_number,
    licence_type: row.licenceType ? String(row.licenceType) : null,
    status: row.status ? String(row.status) : null,
    granted: row.granted ? String(row.granted).slice(0, 10) : null,
    expires: row.expires ? String(row.expires).slice(0, 10) : null,
    licensee,
    licensee_type: row.licenseeType ? String(row.licenseeType) : null,
    suburb: String(row.suburb ?? "")
      .trim()
      .replace(/\w\S*/g, (w) => w[0] + w.slice(1).toLowerCase()),
    state: String(row.state ?? "NSW"),
    postcode: String(row.postcode ?? ""),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    abn: row.ABN ? String(row.ABN) : null,
    acn: row.ACN ? String(row.ACN) : null,
    verify_url: verifyNswUrl(licence_number),
  };

  if (requireSydney && !isGreaterSydneyBuilder(mapped)) return null;
  return mapped;
}

export const DEFAULT_NSW_SEARCH_TERMS = [
  "Homes Pty",
  "Construction Pty",
  "Building Pty",
  "Builders Pty",
  "Projects Pty",
  "Build Pty",
  "Dhursan",
  "Oran Park",
  "Campbelltown",
  "Leppington",
  "Narellan",
  "Gregory Hills",
  "Mount Annan",
  "Gledswood",
  "Liverpool",
  "Camden",
  "Ingleburn",
  "Leumeah",
  "Minto",
  "Prestons",
  "Austral",
  "Metricon",
  "Masterton",
  "Simonds",
  "Apex Homes",
];

export async function searchNswBuilders(
  search: string,
  pageNumber = 0,
  pageSize = 50,
  options?: { statuses?: string[]; requireSydney?: boolean }
): Promise<{ builders: NswRegisterBuilder[]; totalRecords: number; totalPages: number }> {
  const requireSydney = options?.requireSydney ?? true;
  const res = await fetch(NSW_TRADES_ADV_QUERY, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Velu/1.0 (NSW public register collector)",
    },
    body: JSON.stringify({
      licenceGroup: "Trades",
      pageNumber,
      pageSize,
      status: options?.statuses ?? ["Current"],
      licenceClasses: [NSW_BUILDER_CLASS],
      search,
    }),
  });

  if (!res.ok) {
    throw new Error(`Verify NSW search failed (${res.status})`);
  }

  const json = (await res.json()) as AdvResult;
  const builders = (json.results ?? [])
    .map((row) => mapRegisterRow(row, requireSydney))
    .filter((row): row is NswRegisterBuilder => Boolean(row));

  return {
    builders,
    totalRecords: json.pagingInfo?.totalRecords ?? builders.length,
    totalPages: json.pagingInfo?.totalPages ?? 1,
  };
}

const LICENCE_DETAILS_STATUSES = [
  "Current",
  "Expired",
  "Cancelled",
  "Suspended",
  "Surrendered",
];

export async function fetchNswLicenceDetails(
  licenceId: string
): Promise<NswRegisterBuilder | null> {
  const url = `https://verify.licence.nsw.gov.au/publicregisterapi/api/v1/licence/search/details/${encodeURIComponent("Contractor Licence")}/${encodeURIComponent(licenceId)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Velu/1.0 (NSW public register collector)",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Verify NSW details failed (${res.status})`);
  }
  const json = (await res.json()) as { componentData?: Record<string, unknown> };
  if (!json.componentData) return null;
  return mapRegisterRow(json.componentData, false);
}

export async function lookupNswLicence(
  licenceNumber: string,
  licenceId?: string | null
): Promise<NswRegisterBuilder | null> {
  if (licenceId) {
    const details = await fetchNswLicenceDetails(licenceId);
    if (details) return details;
  }

  const { builders } = await searchNswBuilders(licenceNumber, 0, 10, {
    statuses: LICENCE_DETAILS_STATUSES,
    requireSydney: false,
  });
  return (
    builders.find((row) => row.licence_number === licenceNumber) ??
    builders[0] ??
    null
  );
}

export async function collectNswBuildersForTerms(
  terms: string[],
  options?: { maxPages?: number; delayMs?: number }
): Promise<NswRegisterBuilder[]> {
  const maxPages = options?.maxPages ?? 2;
  const delayMs = options?.delayMs ?? 150;
  const byLicence = new Map<string, NswRegisterBuilder>();

  for (const term of terms) {
    for (let page = 0; page < maxPages; page += 1) {
      const { builders, totalPages } = await searchNswBuilders(term, page, 50);
      for (const builder of builders) {
        byLicence.set(builder.licence_number, builder);
      }
      if (page + 1 >= totalPages) break;
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return [...byLicence.values()];
}
