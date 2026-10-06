import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { proposalFieldsSchema } from "@/lib/proposal-schema";
import { defaultLineKind } from "@/lib/quote-structure";
import { canEditProposal } from "@/lib/proposals";
import { createClient } from "@/lib/supabase/server";
import type { ProposalStatus } from "@/lib/types";

const patchSchema = z.union([
  z.object({ action: z.literal("withdraw") }),
  proposalFieldsSchema.extend({ action: z.literal("update").optional() }),
]);

function normalizeBreakdown(
  lines: Array<{
    category: string;
    label: string;
    amount: number;
    note?: string;
    line_kind?: "lump_sum" | "pc" | "ps" | "allowance";
    provisional?: boolean;
  }> | undefined
) {
  return (lines ?? []).map((line) => ({
    ...line,
    line_kind: line.line_kind ?? defaultLineKind(line.category),
    provisional:
      line.provisional ?? (line.category === "site" ? true : undefined),
  }));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = patchSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { data: proposal } = await supabase
    .from("builder_proposals")
    .select(
      "id, builder_id, land_listing_id, buyer_id, package_name, status"
    )
    .eq("id", id)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (proposal.builder_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = proposal.status as ProposalStatus;

  if (body.data.action === "withdraw") {
    if (!canEditProposal(status)) {
      return NextResponse.json(
        {
          error:
            status === "accepted"
              ? "Accepted proposals cannot be withdrawn. Variations are a later step."
              : "Only pending or viewed proposals can be withdrawn.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("builder_proposals")
      .update({
        status: "withdrawn",
        responded_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("builder_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (proposal.buyer_id) {
      try {
        const admin = await createServiceClient();
        await admin.from("notifications").insert({
          recipient_id: proposal.buyer_id,
          type: "proposal_received",
          title: "Proposal withdrawn",
          body: `${proposal.package_name} was withdrawn. The builder may send an updated quote.`,
          metadata: {
            proposal_id: id,
            listing_id: proposal.land_listing_id,
          },
        });
      } catch {
        // Notification is best-effort.
      }
    }

    return NextResponse.json({ success: true, status: "withdrawn" });
  }

  if (!canEditProposal(status)) {
    return NextResponse.json(
      {
        error:
          status === "accepted"
            ? "Accepted proposals cannot be edited. Variations are a later step."
            : "Only pending or viewed proposals can be edited.",
      },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("builder_proposals")
    .update({
      package_name: body.data.package_name,
      base_price: body.data.base_price,
      contract_type: body.data.contract_type,
      inclusions: body.data.inclusions ?? null,
      estimated_build_weeks: body.data.estimated_build_weeks ?? null,
      notes: body.data.notes ?? null,
      price_breakdown: normalizeBreakdown(body.data.price_breakdown),
      inclusion_items: body.data.inclusion_items ?? [],
      home_specs: body.data.home_specs ?? {},
    })
    .eq("id", id)
    .eq("builder_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status });
}
