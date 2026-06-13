import { createServiceClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function validateInquiryParticipants(
  supabase: SupabaseClient,
  listingId: string,
  userId: string,
  role: "buyer" | "builder",
  counterpartyId: string
): Promise<{ ok: true; buyerId: string; builderId: string } | { ok: false; error: string }> {
  const { data: listing } = await supabase
    .from("land_listings")
    .select("id, status, buyer_id")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return { ok: false, error: "Land listing not found." };
  }

  if (listing.status !== "sold") {
    return {
      ok: false,
      error: "Messaging is available once land is secured (sold or registered).",
    };
  }

  if (!listing.buyer_id) {
    return {
      ok: false,
      error: "This listing is not linked to a buyer yet.",
    };
  }

  if (role === "buyer") {
    if (userId !== listing.buyer_id) {
      return { ok: false, error: "You can only message builders about your own land." };
    }
    const { data: builder } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", counterpartyId)
      .single();
    if (builder?.role !== "builder") {
      return { ok: false, error: "Invalid builder." };
    }
    return { ok: true, buyerId: userId, builderId: counterpartyId };
  }

  if (role === "builder") {
    if (counterpartyId !== listing.buyer_id) {
      return { ok: false, error: "Invalid buyer." };
    }
    const { data: builderProfile } = await supabase
      .from("builder_profiles")
      .select("is_onboarded")
      .eq("id", userId)
      .single();
    if (!builderProfile?.is_onboarded) {
      return { ok: false, error: "Complete onboarding before messaging buyers." };
    }
    return { ok: true, buyerId: listing.buyer_id, builderId: userId };
  }

  return { ok: false, error: "Forbidden." };
}

export async function notifyMessageReceived(
  recipientId: string,
  senderName: string,
  inquiryId: string,
  listingId: string | null,
  preview: string
): Promise<void> {
  const admin = await createServiceClient();
  await admin.from("notifications").insert({
    recipient_id: recipientId,
    type: "message_received",
    title: `Message from ${senderName}`,
    body: preview.slice(0, 120),
    metadata: {
      inquiry_id: inquiryId,
      listing_id: listingId ?? "",
    },
  });
}

export async function upsertInquiryThread(
  supabase: SupabaseClient,
  params: {
    buyerId: string;
    builderId: string;
    listingId: string;
    initiatedBy: string;
    messageBody: string;
    senderId: string;
  }
): Promise<{ inquiryId: string; created: boolean }> {
  const { data: existing } = await supabase
    .from("builder_inquiries")
    .select("id")
    .eq("buyer_id", params.buyerId)
    .eq("builder_id", params.builderId)
    .eq("land_listing_id", params.listingId)
    .maybeSingle();

  let inquiryId = existing?.id;

  if (!inquiryId) {
    const { data: created, error } = await supabase
      .from("builder_inquiries")
      .insert({
        buyer_id: params.buyerId,
        builder_id: params.builderId,
        land_listing_id: params.listingId,
        initiated_by: params.initiatedBy,
        status: "inquiry_sent",
        last_message_at: new Date().toISOString(),
        last_message_preview: params.messageBody.slice(0, 160),
      })
      .select("id")
      .single();

    if (error || !created) {
      throw new Error(error?.message ?? "Failed to start conversation.");
    }
    inquiryId = created.id;
  } else {
    const { error } = await supabase
      .from("builder_inquiries")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: params.messageBody.slice(0, 160),
        updated_at: new Date().toISOString(),
      })
      .eq("id", inquiryId);

    if (error) {
      throw new Error(error.message);
    }
  }

  const { error: messageError } = await supabase.from("inquiry_messages").insert({
    inquiry_id: inquiryId,
    sender_id: params.senderId,
    body: params.messageBody,
  });

  if (messageError) {
    throw new Error(messageError.message);
  }

  return { inquiryId, created: !existing };
}
