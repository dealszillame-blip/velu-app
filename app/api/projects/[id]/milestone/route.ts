import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ConstructionMilestone } from "@/lib/types";

const schema = z.object({
  stage: z.enum([
    "contract",
    "slab",
    "frame",
    "lockup",
    "fixing",
    "completion",
  ]),
});

const STAGE_ORDER: ConstructionMilestone[] = [
  "contract",
  "slab",
  "frame",
  "lockup",
  "fixing",
  "completion",
];

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
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
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

  const currentIndex = STAGE_ORDER.indexOf(
    project.current_stage as ConstructionMilestone
  );
  const nextIndex = STAGE_ORDER.indexOf(body.data.stage);

  if (nextIndex !== currentIndex + 1) {
    return NextResponse.json(
      { error: "Stages must advance one step at a time." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("construction_projects")
    .update({
      current_stage: body.data.stage,
      stage_updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await createServiceClient().then((admin) =>
    admin.from("notifications").insert({
      recipient_id: project.buyer_id,
      type: "milestone_update",
      title: "Build milestone updated",
      body: `Your project advanced to ${body.data.stage}.`,
      metadata: { project_id: id, stage: body.data.stage },
    })
  );

  return NextResponse.json({ success: true, stage: body.data.stage });
}
