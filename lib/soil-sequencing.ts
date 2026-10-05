import type { SiteReportRequestStatus } from "@/lib/site-reports";

export const SITE_COSTS_PROVISIONAL_COPY =
  "Site costs are an estimate until a soil report is delivered. Indicative quotes are still allowed — this is not a hard block.";

export const ACCEPT_COOLING_OFF_COPY =
  "This is not a building contract. Confirm cooling-off, deposits, and contract terms with your solicitor and NSW Fair Trading before you pay anything. Velu does not collect deposits.";

type SoilRequestLike = {
  report_definition_key?: string | null;
  land_listing_id?: string | null;
  status?: string | null;
};

export function isSoilReportDelivered(
  requests: SoilRequestLike[] | null | undefined,
  listingId?: string
): boolean {
  return (requests ?? []).some((row) => {
    if (row.report_definition_key !== "soil_report") return false;
    if (listingId && row.land_listing_id && row.land_listing_id !== listingId) {
      return false;
    }
    return row.status === "delivered";
  });
}

export function siteCostsAreProvisional(
  requests: SoilRequestLike[] | null | undefined,
  listingId?: string
): boolean {
  return !isSoilReportDelivered(requests, listingId);
}

export function soilStatusForListing(
  requests: SoilRequestLike[] | null | undefined,
  listingId: string
): SiteReportRequestStatus | null {
  const match = (requests ?? []).find(
    (row) =>
      row.report_definition_key === "soil_report" &&
      row.land_listing_id === listingId
  );
  return (match?.status as SiteReportRequestStatus | undefined) ?? null;
}
