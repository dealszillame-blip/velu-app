import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyBuildersOnSold } from "@/lib/leads/notify-on-sold";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  status: z.enum(["available", "under_offer", "sold"]),
});

function isSyncAuthorized(request: Request): boolean {
  const secret = process.env.DOMAIN_SYNC_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const syncAuth = isSyncAuthorized(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !syncAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const client = syncAuth ? await createServiceClient() : supabase;

  const { data: existing } = await client
    .from("land_listings")
    .select("id, status, land_size_sqm, suburb, postcode, agent_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (!syncAuth && existing.agent_id !== user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: Record<string, unknown> = { status: body.data.status };
  if (body.data.status === "sold") {
    update.sold_at = new Date().toISOString();
  }

  let updateQuery = client.from("land_listings").update(update).eq("id", id);

  if (!syncAuth) {
    updateQuery = updateQuery.eq("agent_id", user!.id);
  }

  const { data, error } = await updateQuery
    .select("id, status, sold_at, land_size_sqm, suburb, postcode")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.data.status === "sold" && existing.status !== "sold" && data) {
    await notifyBuildersOnSold({
      id: data.id,
      land_size_sqm: data.land_size_sqm,
      suburb: data.suburb,
      postcode: data.postcode,
    });
  }

  return NextResponse.json({ success: true, listing: data });
}
