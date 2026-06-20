"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BuyerBuildRequirementsFields } from "@/components/buyer/BuyerBuildRequirementsFields";
import { BuyerRequirementsSummary } from "@/components/buyer/BuyerRequirementsSummary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  defaultBuildRequirements,
  type BuyerBuildRequirements,
} from "@/lib/buyer-requirements";

export function BuyerRequirementsEditor() {
  const [requirements, setRequirements] = useState<BuyerBuildRequirements>(
    defaultBuildRequirements()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/buyer/requirements");
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.build_requirements) {
      setRequirements(data.build_requirements);
      setHasSaved(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/buyer/requirements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requirements),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to save requirements.");
      setSaving(false);
      return;
    }

    setRequirements(data.build_requirements);
    setHasSaved(true);
    setEditing(false);
    setSuccess(true);
    setSaving(false);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading…
        </CardContent>
      </Card>
    );
  }

  if (!editing && hasSaved) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Your build requirements</CardTitle>
            <CardDescription>
              Builders see this when reviewing your land or proposals.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 rounded-full"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <BuyerRequirementsSummary requirements={requirements} />
          {success && (
            <p className="text-sm text-primary" role="status">
              Requirements updated.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {hasSaved ? "Update build requirements" : "Your build requirements"}
        </CardTitle>
        <CardDescription>
          Help builders understand what you want before they submit a proposal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <BuyerBuildRequirementsFields
            value={requirements}
            onChange={setRequirements}
          />
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            {hasSaved && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save requirements"}
            </Button>
          </div>
        </form>
        {!hasSaved && (
          <p className="mt-4 text-sm text-muted-foreground">
            You can update these anytime from{" "}
            <Link href="/buyer/requirements" className="text-link">
              Build requirements
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}
