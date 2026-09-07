import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_SITE_REPORT_DEFINITIONS,
  SITE_REPORTS_MIGRATION_HINT,
  calculateReportPrice,
  isSiteReportsSchemaError,
  type BuyerSiteReportRequest,
  type SiteReportDefinition,
  type SiteReportPricingLand,
  type SiteReportRequestStatus,
} from "@/lib/site-reports";

type SiteReportRequestRow = {
  id: string;
  report_definition_key: string;
  status: SiteReportRequestStatus;
  buyer_notes: string | null;
  quoted_price: number | null;
  requested_at: string;
  created_at: string;
  updated_at: string;
  site_report_definitions:
    | (SiteReportDefinition & { is_active?: boolean })
    | (SiteReportDefinition & { is_active?: boolean })[]
    | null;
};

function normalizeDefinition(
  definition: SiteReportRequestRow["site_report_definitions"]
) {
  return Array.isArray(definition) ? definition[0] : definition;
}

export function mapSiteReportRequests(
  requests: SiteReportRequestRow[] | null | undefined
): BuyerSiteReportRequest[] {
  return (requests ?? [])
    .map((request) => {
      const definition = normalizeDefinition(request.site_report_definitions);

      return {
        id: request.id,
        report_definition_key: request.report_definition_key,
        report_name: definition?.name ?? request.report_definition_key,
        report_description: definition?.description ?? "",
        status: request.status,
        buyer_notes: request.buyer_notes,
        quoted_price: request.quoted_price,
        requested_at: request.requested_at,
        created_at: request.created_at,
        updated_at: request.updated_at,
      };
    })
    .sort((a, b) => a.report_name.localeCompare(b.report_name));
}

export async function loadActiveSiteReportDefinitions(
  supabase: SupabaseClient
): Promise<{ definitions: SiteReportDefinition[]; schemaReady: boolean }> {
  const { data, error } = await supabase
    .from("site_report_definitions")
    .select("key, name, description, price, pricing_rules, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    if (isSiteReportsSchemaError(error.message)) {
      return {
        definitions: DEFAULT_SITE_REPORT_DEFINITIONS,
        schemaReady: false,
      };
    }

    throw new Error(error.message);
  }

  if (!data?.length) {
    return {
      definitions: DEFAULT_SITE_REPORT_DEFINITIONS,
      schemaReady: true,
    };
  }

  return {
    definitions: data as SiteReportDefinition[],
    schemaReady: true,
  };
}

export async function createSiteReportRequests({
  supabase,
  buyerId,
  listing,
  reportKeys,
  buyerNotes,
}: {
  supabase: SupabaseClient;
  buyerId: string;
  listing: SiteReportPricingLand;
  reportKeys: string[];
  buyerNotes?: string | null;
}) {
  const uniqueKeys = Array.from(new Set(reportKeys));

  if (uniqueKeys.length === 0) {
    return { created: 0 };
  }

  const { definitions, schemaReady } =
    await loadActiveSiteReportDefinitions(supabase);

  if (!schemaReady) {
    throw new Error(
      `Site report requests could not be saved. ${SITE_REPORTS_MIGRATION_HINT}`
    );
  }

  const selectedDefinitions = definitions.filter((definition) =>
    uniqueKeys.includes(definition.key)
  );

  if (selectedDefinitions.length !== uniqueKeys.length) {
    throw new Error("One or more selected site reports are unavailable.");
  }

  const { data: existingRequests, error: existingError } = await supabase
    .from("site_report_requests")
    .select("report_definition_key")
    .eq("land_listing_id", listing.id)
    .in("report_definition_key", uniqueKeys);

  if (existingError) {
    if (isSiteReportsSchemaError(existingError.message)) {
      throw new Error(
        `Site report requests could not be saved. ${SITE_REPORTS_MIGRATION_HINT}`
      );
    }

    throw new Error(existingError.message);
  }

  const existingKeys = new Set(
    (existingRequests ?? []).map((row) => row.report_definition_key)
  );
  const newDefinitions = selectedDefinitions.filter(
    (definition) => !existingKeys.has(definition.key)
  );

  if (newDefinitions.length === 0) {
    throw new Error("All selected site reports have already been requested.");
  }

  const reportRows = newDefinitions.map((report) => ({
    report_definition_key: report.key,
    land_listing_id: listing.id,
    buyer_id: buyerId,
    status: "requested" as const,
    buyer_notes: buyerNotes?.trim() || null,
    quoted_price: calculateReportPrice(report, listing),
    pricing_snapshot: {
      report_key: report.key,
      report_price: report.price,
      pricing_rules: report.pricing_rules,
    },
  }));

  const { error: insertError } = await supabase
    .from("site_report_requests")
    .insert(reportRows);

  if (insertError) {
    if (isSiteReportsSchemaError(insertError.message)) {
      throw new Error(
        `Site report requests could not be saved. ${SITE_REPORTS_MIGRATION_HINT}`
      );
    }

    throw new Error(insertError.message);
  }

  return { created: reportRows.length };
}
