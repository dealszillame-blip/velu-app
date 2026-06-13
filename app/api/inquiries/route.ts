import { NextResponse } from "next/server";
import { z } from "zod";
import {
  notifyMessageReceived,
  upsertInquiryThread,
  validateInquiryParticipants,
} from "@/lib/inquiries";
import {
  containsContactInfo,
  contactInfoError,
  publicCounterpartName,
} from "@/lib/messaging";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  land_listing_id: z.string().uuid(),
  counterparty_id: z.string().uuid(),
  message: z.string().trim().min(10).max(4000),
});

export async function GET() {
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

  if (profile?.role !== "buyer" && profile?.role !== "builder") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase.rpc("get_inquiry_threads_for_user", {
    p_user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, company_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "buyer" && profile?.role !== "builder") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = createSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (containsContactInfo(body.data.message)) {
    return NextResponse.json({ error: contactInfoError() }, { status: 422 });
  }

  const validation = await validateInquiryParticipants(
    supabase,
    body.data.land_listing_id,
    user.id,
    profile.role as "buyer" | "builder",
    body.data.counterparty_id
  );

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 403 });
  }

  try {
    const { inquiryId } = await upsertInquiryThread(supabase, {
      buyerId: validation.buyerId,
      builderId: validation.builderId,
      listingId: body.data.land_listing_id,
      initiatedBy: user.id,
      messageBody: body.data.message,
      senderId: user.id,
    });

    const recipientId =
      user.id === validation.buyerId
        ? validation.builderId
        : validation.buyerId;

    const senderName = publicCounterpartName(
      profile.full_name,
      profile.company_name,
      profile.role as "buyer" | "builder"
    );

    await notifyMessageReceived(
      recipientId,
      senderName,
      inquiryId,
      body.data.land_listing_id,
      body.data.message
    );

    return NextResponse.json({ id: inquiryId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
