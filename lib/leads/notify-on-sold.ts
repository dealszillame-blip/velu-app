import { createServiceClient } from "@/lib/supabase/admin";

export interface SoldListingPayload {
  id: string;
  land_size_sqm: number;
  suburb: string;
  postcode: string;
  source?: string;
}

function leadCopy(listing: SoldListingPayload): {
  title: string;
  body: string;
  emailSubject: string;
  emailBody: (builderName: string, appUrl: string) => string;
} {
  if (listing.source === "buyer_owned") {
    return {
      title: "Buyer ready to build nearby",
      body: `A buyer with ${listing.land_size_sqm}m² in ${listing.suburb} ${listing.postcode} is looking for builders. Submit your proposal now.`,
      emailSubject: `Build lead: ${listing.land_size_sqm}m² in ${listing.suburb}`,
      emailBody: (builderName, appUrl) =>
        `Hi ${builderName},\n\nA buyer who already owns land in ${listing.suburb} ${listing.postcode} (${listing.land_size_sqm}m²) is ready to build.\n\nSubmit your proposal: ${appUrl}/builder/leads/${listing.id}\n\nVelu`,
    };
  }

  return {
    title: "New land sold nearby",
    body: `${listing.land_size_sqm}m² in ${listing.suburb} ${listing.postcode} just sold. Submit your proposal now.`,
    emailSubject: `New lead: ${listing.land_size_sqm}m² in ${listing.suburb}`,
    emailBody: (builderName, appUrl) =>
      `Hi ${builderName},\n\nA ${listing.land_size_sqm}m² lot in ${listing.suburb} ${listing.postcode} just sold.\n\nSubmit your proposal: ${appUrl}/builder/leads/${listing.id}\n\nVelu`,
  };
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
  const copy = leadCopy(listing);

  await Promise.allSettled(
    builders.map(async (builder: Record<string, string>) => {
      await supabase.from("notifications").insert({
        recipient_id: builder.id,
        type: "new_lead",
        title: copy.title,
        body: copy.body,
        metadata: {
          listing_id: listing.id,
          suburb: listing.suburb,
          postcode: listing.postcode,
          source: listing.source ?? "agent",
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
            subject: copy.emailSubject,
            content: [
              {
                type: "text/plain",
                value: copy.emailBody(builder.full_name, appUrl),
              },
            ],
          }),
        });
      }
    })
  );

  return { dispatched: builders.length };
}
