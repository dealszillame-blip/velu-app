"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AdminBuilderEditorProps = {
  builderId: string;
};

const ONBOARDING_STATUSES = [
  "licence_pending",
  "insurance_pending",
  "designs_pending",
  "approval_pending",
  "onboarded",
] as const;

export function AdminBuilderEditor({ builderId }: AdminBuilderEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [form, setForm] = useState({
    license_number: "",
    license_expiry: "",
    onboarding_status: "licence_pending" as string,
    is_license_valid: true,
    insurance_verified: false,
    is_onboarded: false,
    profile_published: false,
    onboarding_notes: "",
  });

  useEffect(() => {
    fetch(`/api/admin/builders/${builderId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load builder.");
        setForm({
          license_number: data.license_number ?? "",
          license_expiry: data.license_expiry ?? "",
          onboarding_status: data.onboarding_status ?? "licence_pending",
          is_license_valid: data.is_license_valid ?? true,
          insurance_verified: data.insurance_verified ?? false,
          is_onboarded: data.is_onboarded ?? false,
          profile_published: data.profile_published ?? false,
          onboarding_notes: data.onboarding_notes ?? "",
        });
        setProfileName(
          data.profile?.company_name || data.profile?.full_name || ""
        );
        setProfileEmail(data.profile?.email ?? "");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [builderId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/admin/builders/${builderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_number: form.license_number,
        license_expiry: form.license_expiry || null,
        onboarding_status: form.onboarding_status,
        is_license_valid: form.is_license_valid,
        insurance_verified: form.insurance_verified,
        is_onboarded: form.is_onboarded,
        profile_published: form.profile_published,
        onboarding_notes: form.onboarding_notes || null,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Save failed.");
      setSaving(false);
      return;
    }

    setMessage("Builder profile updated.");
    setSaving(false);
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading builder…</p>;
  }

  if (error && !form.license_number) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{profileName || "Builder verification"}</CardTitle>
        {profileEmail && (
          <p className="text-sm text-muted-foreground">{profileEmail}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="license_number">Licence number</Label>
            <Input
              id="license_number"
              value={form.license_number}
              onChange={(e) =>
                setForm({ ...form, license_number: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license_expiry">Licence expiry</Label>
            <Input
              id="license_expiry"
              type="date"
              value={form.license_expiry}
              onChange={(e) =>
                setForm({ ...form, license_expiry: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onboarding_status">Onboarding status</Label>
            <select
              id="onboarding_status"
              value={form.onboarding_status}
              onChange={(e) =>
                setForm({ ...form, onboarding_status: e.target.value })
              }
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              {ONBOARDING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="onboarding_notes">Admin notes</Label>
            <textarea
              id="onboarding_notes"
              value={form.onboarding_notes}
              onChange={(e) =>
                setForm({ ...form, onboarding_notes: e.target.value })
              }
              className="min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_license_valid}
              onChange={(e) =>
                setForm({ ...form, is_license_valid: e.target.checked })
              }
            />
            Licence valid
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.insurance_verified}
              onChange={(e) =>
                setForm({ ...form, insurance_verified: e.target.checked })
              }
            />
            Insurance verified
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_onboarded}
              onChange={(e) =>
                setForm({ ...form, is_onboarded: e.target.checked })
              }
            />
            Onboarded (can receive leads)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.profile_published}
              onChange={(e) =>
                setForm({ ...form, profile_published: e.target.checked })
              }
            />
            Public profile published
          </label>
          {error && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-green-700 sm:col-span-2" role="status">
              {message}
            </p>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Link
              href="/admin/builders"
              className="inline-flex items-center text-sm text-link"
            >
              Back to builders
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
