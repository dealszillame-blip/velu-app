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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AdminUserEditorProps = {
  userId: string;
};

type UserDetail = {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone_number: string | null;
  company_name: string | null;
  agency_licence_number: string | null;
  agency_licence_expiry: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  rejection_reason: string | null;
  has_profile: boolean;
};

export function AdminUserEditor({ userId }: AdminUserEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordAction, setPasswordAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    company_name: "",
    role: "buyer",
    agency_licence_number: "",
    agency_licence_expiry: "",
  });
  const [meta, setMeta] = useState({
    email_confirmed_at: null as string | null,
    last_sign_in_at: null as string | null,
    rejection_reason: null as string | null,
  });

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load user.");
        setForm({
          full_name: data.full_name ?? "",
          email: data.email ?? "",
          phone_number: data.phone_number ?? "",
          company_name: data.company_name ?? "",
          role: data.role ?? "buyer",
          agency_licence_number: data.agency_licence_number ?? "",
          agency_licence_expiry: data.agency_licence_expiry ?? "",
        });
        setMeta({
          email_confirmed_at: data.email_confirmed_at,
          last_sign_in_at: data.last_sign_in_at,
          rejection_reason: data.rejection_reason,
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: form.role,
        full_name: form.full_name,
        phone_number: form.phone_number || null,
        company_name: form.company_name || null,
        agency_licence_number: form.agency_licence_number || null,
        agency_licence_expiry: form.agency_licence_expiry || null,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Save failed.");
      setSaving(false);
      return;
    }

    setMessage("Profile saved.");
    setSaving(false);
    router.refresh();
  }

  async function handlePasswordAction(action: "send_reset" | "set_password") {
    setPasswordAction(action);
    setError(null);
    setMessage(null);

    const body =
      action === "send_reset"
        ? { action: "send_reset" }
        : { action: "set_password", password: newPassword };

    const res = await fetch(`/api/admin/users/${userId}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Password action failed.");
    } else {
      setMessage(data.message ?? "Done.");
      if (action === "set_password") setNewPassword("");
    }
    setPasswordAction(null);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading user…</p>;
  }

  if (error && !form.full_name) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Edit user details and role.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={form.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone</Label>
              <Input
                id="phone_number"
                value={form.phone_number}
                onChange={(e) =>
                  setForm({ ...form, phone_number: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Company</Label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={(e) =>
                  setForm({ ...form, company_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="buyer">buyer</option>
                <option value="builder">builder</option>
                <option value="agent">agent</option>
                <option value="pending_agent">pending_agent</option>
                <option value="admin">admin</option>
              </select>
            </div>
            {(form.role === "agent" || form.role === "pending_agent") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="agency_licence_number">Agency licence</Label>
                  <Input
                    id="agency_licence_number"
                    value={form.agency_licence_number}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        agency_licence_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agency_licence_expiry">Licence expiry</Label>
                  <Input
                    id="agency_licence_expiry"
                    type="date"
                    value={form.agency_licence_expiry}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        agency_licence_expiry: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-green-700" role="status">
                {message}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Link
                href="/admin/users"
                className="inline-flex items-center text-sm text-link"
              >
                Back to users
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Email verified:</span>{" "}
              {meta.email_confirmed_at ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-muted-foreground">Last sign in:</span>{" "}
              {meta.last_sign_in_at
                ? new Date(meta.last_sign_in_at).toLocaleString()
                : "Never"}
            </p>
            {meta.rejection_reason && (
              <p>
                <span className="text-muted-foreground">Rejection note:</span>{" "}
                {meta.rejection_reason}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Send a reset email or set a new password directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              disabled={passwordAction === "send_reset"}
              onClick={() => handlePasswordAction("send_reset")}
            >
              {passwordAction === "send_reset"
                ? "Sending…"
                : "Send password reset email"}
            </Button>
            <div className="space-y-2">
              <Label htmlFor="new_password">Set new password</Label>
              <Input
                id="new_password"
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
              <Button
                type="button"
                disabled={
                  newPassword.length < 8 || passwordAction === "set_password"
                }
                onClick={() => handlePasswordAction("set_password")}
              >
                {passwordAction === "set_password"
                  ? "Updating…"
                  : "Set password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
