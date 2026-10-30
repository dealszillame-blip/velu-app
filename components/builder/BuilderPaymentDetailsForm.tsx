"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clientSafeMessage,
  formatBsb,
  parsePaymentDetails,
  type BuilderPaymentDetails,
} from "@/lib/payment-details";

type BuilderPaymentDetailsFormProps = {
  initial?: BuilderPaymentDetails | null;
  variant?: "card" | "embedded";
};

export function BuilderPaymentDetailsForm({
  initial,
  variant = "card",
}: BuilderPaymentDetailsFormProps) {
  const router = useRouter();
  const [accountName, setAccountName] = useState(initial?.account_name ?? "");
  const [bsb, setBsb] = useState(initial?.bsb ? formatBsb(initial.bsb) : "");
  const [accountNumber, setAccountNumber] = useState(initial?.account_number ?? "");
  const [loading, setLoading] = useState(initial === undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initial !== undefined) return;
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/builder/payment-details");
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) {
        setError(clientSafeMessage(data.error, "Could not load payment details."));
        setLoading(false);
        return;
      }
      setAccountName(typeof data.account_name === "string" ? data.account_name : "");
      setBsb(typeof data.bsb === "string" && data.bsb ? formatBsb(data.bsb) : "");
      setAccountNumber(
        typeof data.account_number === "string" ? data.account_number : ""
      );
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [initial]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parsePaymentDetails({
      account_name: accountName,
      bsb,
      account_number: accountNumber,
    });
    if (!parsed.ok) {
      setSaved(false);
      setError(parsed.error);
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/builder/payment-details", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.value),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(clientSafeMessage(data.error, "Could not save payment details."));
      setSaving(false);
      return;
    }

    setAccountName(parsed.value.account_name);
    setBsb(formatBsb(parsed.value.bsb));
    setAccountNumber(parsed.value.account_number);
    setSaved(true);
    setSaving(false);
    router.refresh();
  }

  const fields = loading ? (
    <p className="text-sm text-muted-foreground">Loading payment details…</p>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-3">
          <Label htmlFor="builder-account-name">Account name</Label>
          <Input
            id="builder-account-name"
            name="builder-account-name"
            autoComplete="off"
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            maxLength={80}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="builder-bsb">BSB</Label>
          <Input
            id="builder-bsb"
            name="builder-bsb"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            placeholder="000-000"
            value={bsb}
            onChange={(event) => setBsb(event.target.value)}
            maxLength={7}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="builder-account-number">Account number</Label>
          <Input
            id="builder-account-number"
            name="builder-account-number"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value)}
            maxLength={12}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        BSB is 6 digits. Account number is 5 to 10 digits. Saving these details
        does not move the stage.
      </p>
      <div className="flex flex-col items-start gap-2">
        <Button type="submit" disabled={saving} className="rounded-full">
          {saving ? "Saving…" : "Save payment details"}
        </Button>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="text-sm text-muted-foreground" role="status">
            Payment details saved. Buyers on your projects can see them on the current stage.
          </p>
        )}
      </div>
    </form>
  );

  if (variant === "embedded") {
    return (
      <div className="mt-4 space-y-3 rounded-xl bg-muted px-4 py-4">
        <div>
          <p className="text-sm font-medium">Payment details you supply</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Not verified by bldwise. bldwise does not process, hold, or transfer the money.
            Buyers are told to call you and read the account name, BSB, and account
            number back before they transfer anything.
          </p>
        </div>
        {fields}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment details you supply</CardTitle>
        <CardDescription>
          Buyers on your projects see these on the current milestone. Not verified
          by bldwise. bldwise does not process, hold, or transfer the money.
        </CardDescription>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  );
}
