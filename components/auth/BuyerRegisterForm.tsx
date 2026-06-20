"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BuyerBuildRequirementsFields } from "@/components/buyer/BuyerBuildRequirementsFields";
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
import {
  defaultBuildRequirements,
  type BuyerBuildRequirements,
} from "@/lib/buyer-requirements";

type BuyerRegisterFormProps = {
  redirectTo?: string;
  variant?: "default" | "own-land";
};

export function BuyerRegisterForm({
  redirectTo = "/buyer/map",
  variant = "default",
}: BuyerRegisterFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [buildRequirements, setBuildRequirements] =
    useState<BuyerBuildRequirements>(defaultBuildRequirements);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          intended_role: "buyer",
          full_name: fullName,
          phone_number: phone || null,
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

    const res = await fetch("/api/onboarding/buyer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        phone_number: phone,
        build_requirements: buildRequirements,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to create profile.");
      setLoading(false);
      return;
    }

    router.refresh();
    window.location.assign(redirectTo);
  }

  if (needsVerification) {
    return (
      <Card className="w-full border-border shadow-[0_8px_32px_rgba(19,49,76,0.08)]">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a verification link to {email}. After confirming, sign in
            and complete your build requirements.
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
    <Card className="w-full border-border shadow-[0_8px_32px_rgba(19,49,76,0.08)]">
      <CardHeader>
        <CardTitle>
          {variant === "own-land"
            ? "Register to find builders"
            : "Register as a buyer"}
        </CardTitle>
        <CardDescription>
          {step === 1
            ? variant === "own-land"
              ? "Step 1 of 2 — your account details"
              : "Step 1 of 2 — create your account"
            : "Step 2 of 2 — your basic build requirements"}
        </CardDescription>
        <div className="flex gap-2 pt-2">
          <span
            className={cn(
              "h-1 flex-1 rounded-full",
              step >= 1 ? "bg-primary" : "bg-muted"
            )}
          />
          <span
            className={cn(
              "h-1 flex-1 rounded-full",
              step >= 2 ? "bg-primary" : "bg-muted"
            )}
          />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
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
                  autoComplete="email"
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
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          ) : (
            <BuyerBuildRequirementsFields
              value={buildRequirements}
              onChange={setBuildRequirements}
              idPrefix="register"
            />
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading
                ? "Creating account…"
                : step === 1
                  ? "Continue"
                  : "Create buyer account"}
            </Button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/register/builder" className="text-link">
            Register as builder
          </Link>
          {" · "}
          <Link href="/register/agent" className="text-link">
            Register as agent
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
