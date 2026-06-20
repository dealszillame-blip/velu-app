"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/lib/types";
import { ROLE_HOME } from "@/lib/types";
import { BuyerBuildRequirementsFields } from "@/components/buyer/BuyerBuildRequirementsFields";
import {
  defaultBuildRequirements,
  type BuyerBuildRequirements,
} from "@/lib/buyer-requirements";

type RoleChoice = Extract<UserRole, "buyer" | "builder" | "agent">;

export function CompleteProfileForm() {
  const router = useRouter();
  const supabase = createClient();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<RoleChoice>("buyer");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [anchorAddress, setAnchorAddress] = useState("");
  const [serviceRadius, setServiceRadius] = useState("25");
  const [agencyLicence, setAgencyLicence] = useState("");
  const [buildRequirements, setBuildRequirements] =
    useState<BuyerBuildRequirements>(defaultBuildRequirements());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?onboarding=required");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role) {
        window.location.assign(ROLE_HOME[profile.role as UserRole]);
        return;
      }

      const meta = user.user_metadata ?? {};
      if (meta.full_name) setFullName(meta.full_name);
      if (meta.phone_number) setPhone(meta.phone_number);
      if (meta.company_name) setCompanyName(meta.company_name);
      if (meta.license_number) setLicenseNumber(meta.license_number);
      if (meta.anchor_address) setAnchorAddress(meta.anchor_address);
      if (meta.agency_licence_number) setAgencyLicence(meta.agency_licence_number);
      if (meta.intended_role === "buyer" || meta.intended_role === "builder" || meta.intended_role === "agent") {
        setRole(meta.intended_role);
      }

      setChecking(false);
    }

    checkSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let endpoint = "/api/onboarding/buyer";
    let body: Record<string, unknown> = {
      full_name: fullName,
      phone_number: phone || null,
      build_requirements: buildRequirements,
    };

    if (role === "agent") {
      endpoint = "/api/onboarding/agent";
      body = {
        full_name: fullName,
        company_name: companyName,
        phone_number: phone || null,
        agency_licence_number: agencyLicence || null,
      };
    }

    if (role === "builder") {
      endpoint = "/api/onboarding/builder";
      body = {
        full_name: fullName,
        company_name: companyName,
        phone_number: phone || null,
        license_number: licenseNumber,
        license_expiry: licenseExpiry || null,
        anchor_address: anchorAddress,
        service_radius_km: Number(serviceRadius),
      };
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create profile.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    window.location.assign(data.redirect ?? ROLE_HOME[role]);
  }

  if (checking) {
    return (
      <Card className="w-full border-border shadow-[0_8px_32px_rgba(19,49,76,0.08)]">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-border shadow-[0_8px_32px_rgba(19,49,76,0.08)]">
      <CardHeader>
        <CardTitle>Finish your profile</CardTitle>
        <CardDescription>
          Your account was created but the profile step didn&apos;t complete.
          Fill in your details below to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>I am a</Label>
            <Select value={role} onValueChange={(v) => setRole(v as RoleChoice)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="builder">Builder</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          {(role === "builder" || role === "agent") && (
            <div className="space-y-2">
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          )}

          {role === "agent" && (
            <div className="space-y-2">
              <Label htmlFor="agencyLicence">Agency licence (optional)</Label>
              <Input
                id="agencyLicence"
                value={agencyLicence}
                onChange={(e) => setAgencyLicence(e.target.value)}
              />
            </div>
          )}

          {role === "buyer" && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="mb-3 text-sm font-medium">Build requirements</p>
              <BuyerBuildRequirementsFields
                value={buildRequirements}
                onChange={setBuildRequirements}
                idPrefix="complete"
              />
            </div>
          )}

          {role === "builder" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">NSW licence number</Label>
                <Input
                  id="licenseNumber"
                  required
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Complete profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
