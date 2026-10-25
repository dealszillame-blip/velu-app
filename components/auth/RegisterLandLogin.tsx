"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BuyerRequirementSets } from "@/components/buyer/BuyerRequirementSets";
import { VeluLogo } from "@/components/shared/VeluLogo";
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
import { createClient } from "@/lib/supabase/client";
import {
  clearBuyerStart,
  readBuyerStart,
  saveLandDraft,
  type BuyerStartDetails,
} from "@/lib/buyer-start";
import {
  briefSaveBlocked,
  composeBuildRequirements,
  defaultBuildRequirements,
  purposeSaveBlocked,
  type BuyerBuildRequirements,
  type LandPurpose,
} from "@/lib/buyer-requirements";

type AccountMode = "create" | "signin";

export function RegisterLandLogin() {
  const router = useRouter();
  const supabase = createClient();
  const [start, setStart] = useState<BuyerStartDetails | null>(null);
  const [ready, setReady] = useState(false);
  const [address, setAddress] = useState("");
  const [landSize, setLandSize] = useState("");
  const [frontage, setFrontage] = useState("");
  const [depth, setDepth] = useState("");
  const [landValue, setLandValue] = useState("");
  const [purpose, setPurpose] = useState<LandPurpose | "">("");
  const [requirementSets, setRequirementSets] = useState<BuyerBuildRequirements[]>([
    defaultBuildRequirements(),
  ]);
  const [mode, setMode] = useState<AccountMode>("create");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const details = readBuyerStart();
    if (!details) {
      router.replace("/login");
      return;
    }
    setStart(details);
    setAddress(details.plotAddress);
    setReady(true);
  }, [router]);

  function currentDraft() {
    return {
      address,
      landSize,
      frontage,
      depth,
      landValue,
      purpose,
      requirementSets,
    };
  }

  async function registerLand() {
    const size = Number(landSize);
    const front = Number(frontage);
    const depthMeters = depth ? Number(depth) : undefined;
    const value = landValue ? Number(landValue) : undefined;
    const buildRequirements = composeBuildRequirements(purpose, requirementSets);
    buildRequirements.land_size_sqm = size;
    buildRequirements.frontage_meters = front;
    if (depthMeters != null) {
      buildRequirements.depth_meters = depthMeters;
    }

    const purposeBlocked = purposeSaveBlocked(buildRequirements);
    if (purposeBlocked) {
      setError(purposeBlocked);
      return false;
    }
    const blocked = briefSaveBlocked(buildRequirements);
    if (blocked) {
      setError(`${blocked} Resolve or confirm the mismatch before saving.`);
      return false;
    }

    const res = await fetch("/api/buyer/land", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        land_size_sqm: size,
        frontage_meters: front,
        land_value: value,
        build_requirements: buildRequirements,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not register this land.");
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!start) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    saveLandDraft(currentDraft());

    try {
      if (mode === "create") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              intended_role: "buyer",
              full_name: start.fullName,
              phone_number: start.phone,
            },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }
        if (!data.session) {
          setInfo(
            `We sent a confirmation link to ${email.trim()}. After you confirm, sign in and register this block. Your name, number, and plot address stay on this device.`
          );
          setLoading(false);
          return;
        }

        const profile = await fetch("/api/onboarding/buyer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: start.fullName,
            phone_number: start.phone,
          }),
        });
        if (!profile.ok) {
          const body = await profile.json().catch(() => ({}));
          setError(body.error ?? "Could not save your name and number.");
          setLoading(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }
      }

      const saved = await registerLand();
      if (!saved) {
        setLoading(false);
        return;
      }
      clearBuyerStart();
      window.location.assign("/buyer/my-land");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!ready || !start) {
    return (
      <p className="text-sm text-muted-foreground">Loading your details…</p>
    );
  }

  return (
    <Card className="w-full border-border shadow-[0_8px_32px_rgba(19,49,76,0.08)]">
      <CardHeader className="space-y-4">
        <VeluLogo size="md" href="/login" />
        <div className="space-y-2">
          <CardTitle className="text-2xl">Register your land</CardTitle>
          <CardDescription>
            {start.fullName} · {start.phone}. Sign in on this page to save the block.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="land-address">Plot address</Label>
              <Input
                id="land-address"
                required
                minLength={5}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="land-size">Land size (m²)</Label>
              <Input
                id="land-size"
                type="number"
                min={1}
                step="0.01"
                required
                placeholder="450"
                value={landSize}
                onChange={(e) => setLandSize(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="land-frontage">Frontage (m)</Label>
              <Input
                id="land-frontage"
                type="number"
                min={1}
                step="0.01"
                required
                placeholder="15.5"
                value={frontage}
                onChange={(e) => setFrontage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="land-depth">Depth (m)</Label>
              <Input
                id="land-depth"
                type="number"
                min={1}
                step="0.01"
                placeholder="30"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="land-value">Estimated land value (optional)</Label>
              <Input
                id="land-value"
                type="number"
                min={0}
                placeholder="650000"
                value={landValue}
                onChange={(e) => setLandValue(e.target.value)}
              />
            </div>
          </div>

          <BuyerRequirementSets
            purpose={purpose}
            onPurposeChange={setPurpose}
            sets={requirementSets}
            onSetsChange={setRequirementSets}
            idPrefix="login-land"
            hideLandMeasurements
            hideBuilderTypes
          />

          <div className="space-y-4 rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium">Log in</p>
              <p className="text-sm text-muted-foreground">
                Create an account or sign in. The block is saved to that account.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={mode === "create" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setMode("create")}
              >
                New account
              </Button>
              <Button
                type="button"
                variant={mode === "signin" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setMode("signin")}
              >
                Sign in
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="land-email">Email</Label>
              <Input
                id="land-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="land-password">Password</Label>
              <Input
                id="land-password"
                type="password"
                autoComplete={mode === "create" ? "new-password" : "current-password"}
                required
                minLength={mode === "create" ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-muted-foreground" role="status">
              {info}{" "}
              <Link href="/login" className="text-link">
                Go to sign in
              </Link>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" className="rounded-full" disabled={loading || Boolean(info)}>
              {loading ? "Saving…" : "Register your land"}
            </Button>
            <Link href="/login" className="text-sm text-link">
              Change name or number
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
