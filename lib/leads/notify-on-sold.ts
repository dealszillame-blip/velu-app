import { createServiceClient } from "@/lib/supabase/admin";

export interface SoldListingPayload {
  id: string;
  land_size_sqm: number;
  suburb: string;
  postcode: string;
}

export async function notifyBuildersOnSold(
  listing: SoldListingPayload
): Promise<{ dispatched: number }> {
  const supabase = await createServiceClient();

  const { data: builders, error } = await supabase.rpc(
    "get_builders_near_listing",
    { p_listing_id: listing.id }
  );

  if (error || !builders?.length) {
    return { dispatched: 0 };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const sendEmail =
    process.env.FEATURE_EMAIL_NOTIFICATIONS === "true" &&
    Boolean(process.env.SENDGRID_API_KEY);

  await Promise.allSettled(
    builders.map(async (builder: Record<string, string>) => {
      await supabase.from("notifications").insert({
        recipient_id: builder.id,
        type: "new_lead",
        title: "New land sold nearby",
        body: `${listing.land_size_sqm}m² in ${listing.suburb} ${listing.postcode} just sold. Submit your proposal now.`,
        metadata: {
          listing_id: listing.id,
          suburb: listing.suburb,
          postcode: listing.postcode,
        },
      });

      if (sendEmail && builder.email) {
        await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: builder.email }] }],
            from: { email: "leads@velu.au", name: "Velu" },
            subject: `New lead: ${listing.land_size_sqm}m² in ${listing.suburb}`,
            content: [
              {
                type: "text/plain",
                value: `Hi ${builder.full_name},\n\nA ${listing.land_size_sqm}m² lot in ${listing.suburb} ${listing.postcode} just sold.\n\nSubmit your proposal: ${appUrl}/builder/leads/${listing.id}\n\nVelu`,
              },
            ],
          }),
        });
      }
    })
  );

  return { dispatched: builders.length };
}
