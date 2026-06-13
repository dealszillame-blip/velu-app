import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicCounterpartName } from "@/lib/messaging";

export async function GET(
  _request: Request,
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

  const { data: thread } = await supabase
    .from("builder_inquiries")
    .select(
      `
      id,
      buyer_id,
      builder_id,
      land_listing_id,
      status,
      initiated_by,
      created_at,
      last_message_at,
      land_listings (address, suburb, postcode)
    `
    )
    .eq("id", id)
    .single();

  if (
    !thread ||
    (thread.buyer_id !== user.id && thread.builder_id !== user.id)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: messages, error } = await supabase
    .from("inquiry_messages")
    .select("id, inquiry_id, sender_id, body, created_at, read_at")
    .eq("inquiry_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("inquiry_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("inquiry_id", id)
    .neq("sender_id", user.id)
    .is("read_at", null);

  const isBuyer = thread.buyer_id === user.id;
  const counterpartyId = isBuyer ? thread.builder_id : thread.buyer_id;

  const { data: counterparty } = await supabase
    .from("profiles")
    .select("full_name, company_name, role")
    .eq("id", counterpartyId)
    .single();

  const listing = thread.land_listings as {
    address: string;
    suburb: string;
    postcode: string;
  } | null;

  return NextResponse.json({
    thread: {
      id: thread.id,
      buyer_id: thread.buyer_id,
      builder_id: thread.builder_id,
      land_listing_id: thread.land_listing_id,
      status: thread.status,
      listing_address: listing?.address ?? null,
      listing_suburb: listing?.suburb ?? null,
      listing_postcode: listing?.postcode ?? null,
      counterpart_name: counterparty
        ? publicCounterpartName(
            counterparty.full_name,
            counterparty.company_name,
            isBuyer ? "builder" : "buyer"
          )
        : "User",
      counterpart_role: isBuyer ? "builder" : "buyer",
    },
    messages: (messages ?? []).map((m) => ({
      ...m,
      is_mine: m.sender_id === user.id,
    })),
  });
}
