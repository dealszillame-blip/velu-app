"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/shared/EmptyState";
import { LandThumbnail } from "@/components/shared/LandThumbnail";
import { StatStrip } from "@/components/shared/StatStrip";
import { listingPriceLabel, type MapListing } from "@/lib/listings";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MapPin, Radio } from "lucide-react";

type LeadRow = MapListing & { sold_at?: string | null };

function formatSoldDate(soldAt?: string | null): string {
  if (!soldAt) return "Recently sold";
  return new Date(soldAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function LeadFeed() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/leads");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load leads");
      setLeads([]);
      return;
    }
    setError(null);
    setLeads(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));

    const supabase = createClient();
    const channel = supabase
      .channel("sold-leads")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "land_listings",
          filter: "status=eq.sold",
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="surface-subtle h-20 animate-pulse" />
          ))}
        </div>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading leads…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<MapPin className="h-6 w-6" strokeWidth={1.5} />}
        title="Leads unavailable"
        description={error}
      />
    );
  }

  if (leads.length === 0) {
    return (
      <div className="space-y-8">
        <EmptyState
          icon={<Radio className="h-6 w-6" strokeWidth={1.5} />}
          title="No leads yet"
          description="When vacant land sells within your service area, it appears here instantly — ready for you to submit a build proposal."
          hint="Demo tip: run 010_demo_seed.sql to create a sold lot at 7 Wattle Grove, Leumeah. Make sure your builder profile anchor is within 25 km of Campbelltown."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((n) => (
            <Card
              key={n}
              className="pointer-events-none overflow-hidden border-0 opacity-40"
              aria-hidden
            >
              <LandThumbnail />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">Leumeah</CardTitle>
                  <Badge variant="secondary" className="rounded-full">
                    Sold
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  7 Wattle Grove, Leumeah
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="label-caps mb-1">Size</p>
                    <p className="font-medium">480 m²</p>
                  </div>
                  <div>
                    <p className="label-caps mb-1">Frontage</p>
                    <p className="font-medium">16 m</p>
                  </div>
                  <div>
                    <p className="label-caps mb-1">Zoning</p>
                    <p className="font-medium">R3</p>
                  </div>
                </div>
                <div className="h-10 rounded-full bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const suburbs = new Set(leads.map((l) => l.suburb)).size;
  const avgSize = Math.round(
    leads.reduce((sum, l) => sum + l.land_size_sqm, 0) / leads.length
  );

  return (
    <div className="space-y-6">
      <StatStrip
        items={[
          { label: "Active leads", value: leads.length },
          { label: "Suburbs", value: suburbs },
          { label: "Avg lot size", value: `${avgSize} m²` },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {leads.map((lead) => (
          <Card
            key={lead.id}
            className={cn(
              "overflow-hidden transition-transform hover:scale-[1.01]",
              "border-0"
            )}
          >
            <LandThumbnail />
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{lead.suburb}</CardTitle>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {lead.address}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 rounded-full">
                  Sold
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-black/[0.06] pb-3">
                <span className="label-caps">Sale price</span>
                <span className="text-xl font-semibold tracking-tight">
                  {listingPriceLabel(lead)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="label-caps mb-1">Size</p>
                  <p className="font-medium">{lead.land_size_sqm} m²</p>
                </div>
                <div>
                  <p className="label-caps mb-1">Frontage</p>
                  <p className="font-medium">{lead.frontage_meters} m</p>
                </div>
                <div>
                  <p className="label-caps mb-1">Zoning</p>
                  <p className="font-medium">{lead.zoning}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatSoldDate(lead.sold_at)}
              </p>
              <Link
                href={`/builder/leads/${lead.id}`}
                className={cn(buttonVariants(), "w-full rounded-full")}
              >
                View & propose
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
