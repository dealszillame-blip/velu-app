import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyMessageReceived, upsertInquiryThread } from "@/lib/inquiries";
import {
  containsContactInfo,
  contactInfoError,
  publicCounterpartName,
} from "@/lib/messaging";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  message: z.string().trim().min(1).max(4000),
});

export async function POST(
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
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (containsContactInfo(body.data.message)) {
    return NextResponse.json({ error: contactInfoError() }, { status: 422 });
  }

  const { data: thread } = await supabase
    .from("builder_inquiries")
    .select("id, buyer_id, builder_id, land_listing_id")
    .eq("id", id)
    .single();

  if (
    !thread ||
    (thread.buyer_id !== user.id && thread.builder_id !== user.id)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, company_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!thread.land_listing_id) {
    return NextResponse.json({ error: "Invalid thread." }, { status: 400 });
  }

  try {
    await upsertInquiryThread(supabase, {
      buyerId: thread.buyer_id,
      builderId: thread.builder_id,
      listingId: thread.land_listing_id,
      initiatedBy: user.id,
      messageBody: body.data.message,
      senderId: user.id,
    });

    const recipientId =
      user.id === thread.buyer_id ? thread.builder_id : thread.buyer_id;

    await notifyMessageReceived(
      recipientId,
      publicCounterpartName(
        profile.full_name,
        profile.company_name,
        profile.role as "buyer" | "builder"
      ),
      thread.id,
      thread.land_listing_id,
      body.data.message
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
