"use client";

import { useEffect, useState } from "react";
import { BuyerRequirementsSummary } from "@/components/buyer/BuyerRequirementsSummary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BuyerBuildRequirements } from "@/lib/buyer-requirements";

type LeadBuyerRequirementsProps = {
  buyerId: string;
};

export function LeadBuyerRequirements({ buyerId }: LeadBuyerRequirementsProps) {
  const [requirements, setRequirements] =
    useState<BuyerBuildRequirements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/builders/buyer/${buyerId}/requirements`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.build_requirements) {
          setRequirements(data.build_requirements);
        }
      })
      .finally(() => setLoading(false));
  }, [buyerId]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading buyer requirements…</p>
    );
  }

  if (!requirements) {
    return (
      <p className="text-sm text-muted-foreground">
        This buyer has not shared build requirements yet. Use Contact buyer to
        clarify their brief.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Buyer build requirements</CardTitle>
        <CardDescription>
          Shared by the buyer at registration — tailor your proposal accordingly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BuyerRequirementsSummary requirements={requirements} />
      </CardContent>
    </Card>
  );
}
