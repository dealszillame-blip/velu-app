export type BuilderPaymentDetails = {
  account_name: string | null;
  bsb: string | null;
  account_number: string | null;
};

export type ParsedPaymentDetails = {
  account_name: string;
  bsb: string;
  account_number: string;
};

export const PAYMENT_DISCLAIMER =
  "Velu does not process this payment. Call the builder and read the account name, BSB, and account number back over the phone before you transfer any money.";

export const PAYMENT_NOT_ON_FILE = "Payment details are not on file yet.";

export const PAYMENT_SUPPLIED_LABEL =
  "Details the builder supplied. Not verified by Velu.";

const EMPTY: BuilderPaymentDetails = {
  account_name: null,
  bsb: null,
  account_number: null,
};

export function emptyPaymentDetails(): BuilderPaymentDetails {
  return { ...EMPTY };
}

export function hasPaymentDetails(
  details: BuilderPaymentDetails | null | undefined
): details is ParsedPaymentDetails {
  return Boolean(
    details?.account_name?.trim() && details.bsb && details.account_number
  );
}

export function formatBsb(bsb: string): string {
  const digits = bsb.replace(/\D/g, "");
  if (digits.length !== 6) return bsb;
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

export function parsePaymentDetails(input: {
  account_name?: unknown;
  bsb?: unknown;
  account_number?: unknown;
}): { ok: true; value: ParsedPaymentDetails } | { ok: false; error: string } {
  const accountName =
    typeof input.account_name === "string" ? input.account_name.trim() : "";
  const bsb = typeof input.bsb === "string" ? input.bsb.replace(/[\s-]/g, "") : "";
  const accountNumber =
    typeof input.account_number === "string"
      ? input.account_number.replace(/[\s-]/g, "")
      : "";

  if (accountName.length < 2 || accountName.length > 80) {
    return { ok: false, error: "Enter the account name (2–80 characters)." };
  }
  if (!/^\d{6}$/.test(bsb)) {
    return { ok: false, error: "Enter a 6-digit BSB." };
  }
  if (!/^\d{5,10}$/.test(accountNumber)) {
    return { ok: false, error: "Enter an account number of 5 to 10 digits." };
  }

  return {
    ok: true,
    value: {
      account_name: accountName,
      bsb,
      account_number: accountNumber,
    },
  };
}

/** Drop messages that might contain an account number before they reach the UI. */
export function clientSafeMessage(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200 || /\d{4,}/.test(trimmed)) return fallback;
  return trimmed;
}

export function paymentDetailsFromRow(row: unknown): BuilderPaymentDetails {
  if (!row || typeof row !== "object") return emptyPaymentDetails();
  const record = row as Partial<BuilderPaymentDetails>;
  return {
    account_name: typeof record.account_name === "string" ? record.account_name : null,
    bsb: typeof record.bsb === "string" ? record.bsb : null,
    account_number:
      typeof record.account_number === "string" ? record.account_number : null,
  };
}
