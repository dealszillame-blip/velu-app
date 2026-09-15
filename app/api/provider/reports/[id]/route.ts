import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  status: z
    .enum(["requested", "quoted", "accepted", "in_progress", "delivered", "cancelled"])
    .optional(),
  quoted_price: z.number().positive().nullable().optional(),
  deliverable_url: z.string().url().nullable().optional(),
  provider_notes: z.string().max(2000).optional(),
  result_summary: z.record(z.string(), z.unknown()).optional(),
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "report_provider") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    assigned_provider_id: user.id,
    ...body.data,
  };

  if (body.data.status === "quoted") {
    update.quoted_at = new Date().toISOString();
  }
  if (body.data.status === "delivered") {
    update.delivered_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("site_report_requests")
    .update(update)
    .eq("id", id)
    .select("id, status, quoted_price, deliverable_url, provider_notes")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
