import { formatAuDate } from "@/lib/defects";
import { HANDOVER_STATUTORY_WARRANTY } from "@/lib/statutory-warranty";

export function HandoverWarrantyNote({
  handoverAt,
}: {
  handoverAt: string | null;
}) {
  const handedOver = formatAuDate(handoverAt);

  return (
    <section className="surface overflow-hidden" aria-labelledby="handover-warranty-heading">
      <div className="px-5 py-4 sm:px-6 sm:py-5">
        <p id="handover-warranty-heading" className="font-medium tracking-tight">
          Statutory warranty
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {HANDOVER_STATUTORY_WARRANTY}
        </p>
        {handedOver ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This build reached handover on {handedOver}.
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This is a record for the buyer and the builder to read. It is not a bldwise
          product and not a claim form.
        </p>
      </div>
    </section>
  );
}
