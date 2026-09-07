import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_ARCHITECTS } from "@/lib/architects";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  architect_keys: z.array(z.string().min(1).max(64)).min(1).max(10),
  buyer_notes: z.string().max(1000).optional(),
});

type RouteContext = { params: Promise<{ listingId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { listingId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("architect_requests")
    .select("id, architect_key, status, buyer_notes, created_at")
    .eq("land_listing_id", listingId)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json([]);
  }

  const nameByKey = Object.fromEntries(
    DEFAULT_ARCHITECTS.map((item) => [item.key, item.name])
  );

  return NextResponse.json(
    (data ?? []).map((row) => ({
      ...row,
      architect_name: nameByKey[row.architect_key] ?? row.architect_key,
    }))
  );
}

export async function POST(request: Request, context: RouteContext) {
  const { listingId } = await context.params;
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

  if (profile?.role !== "buyer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { data: listing } = await supabase
    .from("land_listings")
    .select("id, buyer_id, source")
    .eq("id", listingId)
    .single();

  if (!listing || listing.buyer_id !== user.id || listing.source !== "buyer_owned") {
    return NextResponse.json({ error: "Land not found." }, { status: 404 });
  }

  const rows = body.data.architect_keys.map((key) => ({
    architect_key: key,
    land_listing_id: listingId,
    buyer_id: user.id,
    status: "requested",
    buyer_notes: body.data.buyer_notes?.trim() || null,
  }));

  const { error } = await supabase.from("architect_requests").upsert(rows, {
    onConflict: "land_listing_id,architect_key",
    ignoreDuplicates: true,
  });

  if (error) {
    const message = error.message.includes("architect_requests")
      ? "Architect requests are not set up yet. Run migration 024_buyer_hub_expansion.sql in Supabase."
      : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
