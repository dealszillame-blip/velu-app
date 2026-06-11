"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BuilderRegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [anchorAddress, setAnchorAddress] = useState("");
  const [serviceRadius, setServiceRadius] = useState("25");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          intended_role: "builder",
          full_name: fullName,
          company_name: companyName,
          phone_number: phone || null,
          license_number: licenseNumber,
          license_expiry: licenseExpiry || null,
          anchor_address: anchorAddress,
          service_radius_km: Number(serviceRadius),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setNeedsVerification(true);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/onboarding/builder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        company_name: companyName,
        phone_number: phone,
        license_number: licenseNumber,
        license_expiry: licenseExpiry || null,
        anchor_address: anchorAddress,
        service_radius_km: Number(serviceRadius),
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to create builder profile.");
      setLoading(false);
      return;
    }

    router.refresh();
    window.location.assign("/builder/dashboard");
  }

  if (needsVerification) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            Verify {email}, then sign in to access your builder dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={cn(buttonVariants(), "w-full")}>
            Go to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register as a builder</CardTitle>
        <CardDescription>
          Step {step} of 3 — {step === 1 ? "Account" : step === 2 ? "Licence" : "Service area"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company name</Label>
                <Input
                  id="companyName"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">NSW licence number</Label>
                <Input
                  id="licenseNumber"
                  required
                  placeholder="e.g. 123456C"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseExpiry">Licence expiry (optional)</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                MVP stores licence details only — no API validation yet.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="anchorAddress">Base suburb / address</Label>
                <Input
                  id="anchorAddress"
                  required
                  placeholder="Campbelltown NSW 2560"
                  value={anchorAddress}
                  onChange={(e) => setAnchorAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceRadius">Service radius (km)</Label>
                <Input
                  id="serviceRadius"
                  type="number"
                  min={5}
                  max={100}
                  required
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(e.target.value)}
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading
                ? "Creating account…"
                : step < 3
                  ? "Continue"
                  : "Create builder account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
