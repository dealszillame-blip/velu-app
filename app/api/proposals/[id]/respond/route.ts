import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  action: z.enum(["accept", "reject"]),
});

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

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: proposal } = await supabase
    .from("builder_proposals")
    .select("id, builder_id, land_listing_id, buyer_id, package_name, status")
    .eq("id", id)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const { data: listing } = await supabase
    .from("land_listings")
    .select("buyer_id")
    .eq("id", proposal.land_listing_id)
    .single();

  const isBuyer =
    proposal.buyer_id === user.id ||
    listing?.buyer_id === user.id ||
    (!proposal.buyer_id && !listing?.buyer_id);

  if (!isBuyer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = await createServiceClient();

  if (body.data.action === "reject") {
    const { error } = await admin
      .from("builder_proposals")
      .update({ status: "rejected", responded_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: "rejected" });
  }

  const { error: acceptError } = await admin
    .from("builder_proposals")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", id);

  if (acceptError) {
    return NextResponse.json({ error: acceptError.message }, { status: 500 });
  }

  await admin
    .from("builder_proposals")
    .update({ status: "rejected", responded_at: new Date().toISOString() })
    .eq("land_listing_id", proposal.land_listing_id)
    .neq("id", id)
    .in("status", ["pending", "viewed"]);

  await admin
    .from("land_listings")
    .update({ buyer_id: user.id })
    .eq("id", proposal.land_listing_id);

  const { data: project, error: projectError } = await admin
    .from("construction_projects")
    .insert({
      buyer_id: user.id,
      builder_id: proposal.builder_id,
      land_listing_id: proposal.land_listing_id,
      current_stage: "contract",
    })
    .select("id")
    .single();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  await admin.from("notifications").insert({
    recipient_id: proposal.builder_id,
    type: "proposal_accepted",
    title: "Proposal accepted",
    body: `Your ${proposal.package_name} proposal was accepted.`,
    metadata: {
      proposal_id: id,
      project_id: project.id,
      listing_id: proposal.land_listing_id,
    },
  });

  return NextResponse.json({
    success: true,
    status: "accepted",
    project_id: project.id,
  });
}
