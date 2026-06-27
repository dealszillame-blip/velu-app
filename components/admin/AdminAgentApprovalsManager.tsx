"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PendingAgent = {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
  phone_number: string | null;
  agency_licence_number?: string | null;
  agency_licence_expiry?: string | null;
  created_at: string;
};

export function AdminAgentApprovalsManager() {
  const router = useRouter();
  const [agents, setAgents] = useState<PendingAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load users.");
        const pending = (Array.isArray(data) ? data : []).filter(
          (u: { role: string }) => u.role === "pending_agent"
        );
        setAgents(pending);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (a) =>
        a.full_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.company_name?.toLowerCase().includes(q) ?? false)
    );
  }, [agents, search]);

  async function approve(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "agent" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "Approval failed.");
      return;
    }
    setAgents((rows) => rows.filter((row) => row.id !== id));
    router.refresh();
  }

  async function reject(id: string) {
    const reason = rejectReason.trim();
    if (!reason) {
      alert("Please provide a rejection reason.");
      return;
    }
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "buyer",
        rejection_reason: reason,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "Rejection failed.");
      return;
    }
    setAgents((rows) => rows.filter((row) => row.id !== id));
    setRejectingId(null);
    setRejectReason("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending agent applications</CardTitle>
        <CardDescription>
          Review licence details and approve or reject agent registrations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdminTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search applicants…"
        />
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending agent applications.
          </p>
        ) : (
          <div className="space-y-4">
            {filtered.map((agent) => (
              <div
                key={agent.id}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{agent.full_name}</p>
                    <p className="text-muted-foreground">{agent.email}</p>
                    {agent.company_name && <p>{agent.company_name}</p>}
                    {agent.phone_number && <p>{agent.phone_number}</p>}
                    <p className="text-xs text-muted-foreground">
                      Applied{" "}
                      {new Date(agent.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/users/${agent.id}`}
                      className="inline-flex items-center text-sm text-link"
                    >
                      View details
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => approve(agent.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setRejectingId(
                          rejectingId === agent.id ? null : agent.id
                        )
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
                {rejectingId === agent.id && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Rejection reason (stored on account)…"
                      className="min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => reject(agent.id)}
                    >
                      Confirm rejection
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
