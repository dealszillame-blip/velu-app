import {
  formatBsb,
  hasPaymentDetails,
  PAYMENT_DISCLAIMER,
  PAYMENT_NOT_ON_FILE,
  PAYMENT_SUPPLIED_LABEL,
  type BuilderPaymentDetails,
} from "@/lib/payment-details";

export function StagePaymentDetails({
  details,
}: {
  details: BuilderPaymentDetails | null;
}) {
  const ready = hasPaymentDetails(details);

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-foreground px-4 py-3 text-background" role="note">
        <p className="text-sm font-medium leading-relaxed">{PAYMENT_DISCLAIMER}</p>
      </div>
      {ready ? (
        <>
          <p className="text-sm text-muted-foreground">{PAYMENT_SUPPLIED_LABEL}</p>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="label-caps">Account name</dt>
              <dd className="mt-1 text-sm font-medium">{details.account_name}</dd>
            </div>
            <div>
              <dt className="label-caps">BSB</dt>
              <dd className="mt-1 text-sm font-medium tabular-nums">
                {formatBsb(details.bsb)}
              </dd>
            </div>
            <div>
              <dt className="label-caps">Account number</dt>
              <dd className="mt-1 text-sm font-medium tabular-nums">
                {details.account_number}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="text-sm font-medium">{PAYMENT_NOT_ON_FILE}</p>
      )}
    </div>
  );
}
