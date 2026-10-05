const LIVE_STATUSES = ["draft", "pending", "viewed", "accepted", "rejected"];

export async function upsertLiveProposal(
  supabase: any,
  row: Record<string, unknown>
) {
  const { data: existing, error: findError } = await supabase
    .from("builder_proposals")
    .select("id")
    .eq("builder_id", row.builder_id)
    .eq("land_listing_id", row.land_listing_id)
    .in("status", LIVE_STATUSES)
    .maybeSingle();

  if (findError) {
    return { error: findError };
  }

  if (existing?.id) {
    return supabase.from("builder_proposals").update(row).eq("id", existing.id);
  }

  return supabase.from("builder_proposals").insert(row);
}
