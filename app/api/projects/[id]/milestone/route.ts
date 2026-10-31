import { NextResponse } from "next/server";
import { z } from "zod";
import { nextMilestone } from "@/lib/milestones";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  MILESTONE_LABELS,
  type ConstructionMilestone,
} from "@/lib/types";

const schema = z.object({
  confirm_payment: z.literal(true),
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

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    json = null;
  }

  const body = schema.safeParse(json);
  if (!body.success) {
    return NextResponse.json(
      { error: "Confirm the payment you received before this stage can move." },
      { status: 400 }
    );
  }

  const { data: project } = await supabase
    .from("construction_projects")
    .select("id, builder_id, buyer_id, current_stage")
    .eq("id", id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.builder_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const current = project.current_stage as ConstructionMilestone;
  const upcoming = nextMilestone(current);
  if (!upcoming) {
    return NextResponse.json(
      { error: "This build is already finished." },
      { status: 400 }
    );
  }

  const { error: insertError } = await supabase
    .from("milestone_payment_confirmations")
    .insert({
      project_id: id,
      stage: current,
      confirmed_by: user.id,
    });

  if (insertError && insertError.code !== "23505") {
    return NextResponse.json(
      { error: "Could not record the payment confirmation." },
      { status: 500 }
    );
  }

  if (insertError?.code === "23505") {
    const { data: fresh } = await supabase
      .from("construction_projects")
      .select("current_stage")
      .eq("id", id)
      .single();
    if (fresh && fresh.current_stage !== current) {
      return NextResponse.json({ success: true, stage: fresh.current_stage });
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("construction_projects")
    .update({
      current_stage: upcoming,
      stage_updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("current_stage", current)
    .select("current_stage")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json(
      { error: "Could not update the milestone." },
      { status: 500 }
    );
  }

  if (!updated) {
    const { data: fresh } = await supabase
      .from("construction_projects")
      .select("current_stage")
      .eq("id", id)
      .single();
    return NextResponse.json({
      success: true,
      stage: fresh?.current_stage ?? upcoming,
    });
  }

  await createServiceClient().then((admin) =>
    admin.from("notifications").insert({
      recipient_id: project.buyer_id,
      type: "milestone_update",
      title: "Builder confirmed payment",
      body: `Your builder confirmed they received payment for ${MILESTONE_LABELS[current]}. The build is now at ${MILESTONE_LABELS[upcoming]}. bldwise does not transfer the money.`,
      metadata: { project_id: id, stage: upcoming, confirmed_stage: current },
    })
  );

  return NextResponse.json({ success: true, stage: upcoming });
}
