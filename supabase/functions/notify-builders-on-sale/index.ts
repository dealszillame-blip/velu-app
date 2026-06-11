import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const FEATURE_EMAIL =
  Deno.env.get("FEATURE_EMAIL_NOTIFICATIONS") === "true";

serve(async (req: Request) => {
  const payload = await req.json();

  if (
    payload.record?.status !== "sold" ||
    payload.old_record?.status === "sold"
  ) {
    return json({ message: "Not a sale transition — skipped." });
  }

  const listing = payload.record;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: builders, error } = await supabase.rpc(
    "get_builders_near_listing",
    { p_listing_id: listing.id }
  );

  if (error || !builders?.length) {
    return json({ dispatched: 0, message: "No matching builders." });
  }

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

      if (FEATURE_EMAIL && SENDGRID_API_KEY && builder.email) {
        await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: builder.email }] }],
            from: { email: "leads@velu.au", name: "Velu" },
            subject: `New lead: ${listing.land_size_sqm}m² in ${listing.suburb}`,
            content: [
              {
                type: "text/plain",
                value: `Hi ${builder.full_name},\n\nA ${listing.land_size_sqm}m² lot in ${listing.suburb} ${listing.postcode} just sold.\n\nSubmit your proposal: https://velu.au/builder/leads/${listing.id}\n\nVelu`,
              },
            ],
          }),
        });
      }
    })
  );

  return json({ dispatched: builders.length });
});

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
