"use client";

import { useState } from "react";
import Link from "next/link";
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
  BUILDER_SPECIALTY_OPTIONS,
  type BuilderSpecialty,
} from "@/lib/builder-interest";
import { cn } from "@/lib/utils";

export function BuilderPrelaunchForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [specialties, setSpecialties] = useState<BuilderSpecialty[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleSpecialty(value: BuilderSpecialty) {
    setSpecialties((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/builder-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        phone: phone || undefined,
        company_name: companyName || undefined,
        service_area: serviceArea,
        specialties,
        notes: notes || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <Card className="w-full border-border shadow-[0_8px_32px_rgba(19,49,76,0.08)]">
        <CardHeader>
          <CardTitle className="text-2xl">You&apos;re on the list</CardTitle>
          <CardDescription>
            Thanks for registering your interest. We&apos;ll contact you before
            Velu opens to verified builders in your area.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Already have early access?{" "}
            <Link href="/register/builder" className="text-link">
              Create your builder account
            </Link>
          </p>
          <Link href="/" className="text-link text-sm">
            Back to home
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-border shadow-[0_8px_32px_rgba(19,49,76,0.08)]">
      <CardHeader>
        <CardTitle className="text-2xl">Register builder interest</CardTitle>
        <CardDescription>
          Velu is launching soon for licensed NSW builders. Leave your details
          and we&apos;ll reach out when onboarding opens in your service area.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prelaunch-name">Full name</Label>
              <Input
                id="prelaunch-name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prelaunch-company">Company name</Label>
              <Input
                id="prelaunch-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prelaunch-email">Email</Label>
              <Input
                id="prelaunch-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prelaunch-phone">Phone</Label>
              <Input
                id="prelaunch-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prelaunch-area">Service area</Label>
            <Input
              id="prelaunch-area"
              required
              placeholder="e.g. Campbelltown, Camden, Oran Park and surrounding suburbs"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Suburbs, LGAs, or postcodes you actively build in.
            </p>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Specialties</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {BUILDER_SPECIALTY_OPTIONS.map((option) => {
                const selected = specialties.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleSpecialty(option.value)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="prelaunch-notes">Anything else? (optional)</Label>
            <textarea
              id="prelaunch-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Typical project size, licence number, current volume…"
              className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-full text-base"
            disabled={loading || specialties.length === 0}
          >
            {loading ? "Submitting…" : "Register interest"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already invited?{" "}
            <Link href="/register/builder" className="text-link">
              Sign up as a builder
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
