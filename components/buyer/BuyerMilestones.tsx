"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ExistingLandSiteReports } from "@/components/buyer/ExistingLandSiteReports";
import { buttonVariants } from "@/components/ui/button";
import type { BuyerOwnedLand } from "@/lib/buyer-land";
import { cn } from "@/lib/utils";

type BuyerMilestonesProps = {
  listingId?: string;
  docsWarning?: boolean;
};

const STEPS = [
  {
    id: "m1",
    title: "Milestone 1 — Land registration",
    body: "Land registration completed. Your block is on bldwise, and the next step is to meet the builders who can work on it.",
    done: true,
  },
  {
    id: "m2",
    title: "Milestone 2 — Site survey and soil report",
    body: "Optional. A site survey and soil report before you ask builders for quotes gives them a clearer site, so the estimates are closer to the real build.",
  },
  {
    id: "m2b",
    title: "Milestone 2 — Or with the tender",
    body: "Or the site survey and geotechnical report is done by the initial signing of the tender.",
  },
  {
    id: "m3",
    title: "Milestone 3 — Quote review",
    body: "A quote you request is then analysed by bldwise’s team. They set out any gaps and the difference between inclusions and exclusions, plus a recommendation if you should ask the contractor for something further.",
  },
  {
    id: "m4",
    title: "Milestone 4 — Display homes",
    body: "The top 2 quotes, once done, take you to a page to decide a meeting so you can visit display homes.",
  },
];

export function BuyerMilestones({ listingId, docsWarning }: BuyerMilestonesProps) {
  const [parcels, setParcels] = useState<BuyerOwnedLand[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/buyer/land")
      .then((res) => res.json())
      .then((data) => setParcels(Array.isArray(data) ? data : []))
      .catch(() => setParcels([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const parcel =
    parcels.find((item) => item.id === listingId) ?? parcels[0] ?? null;
  const registered = parcels.length > 0;

  return (
    <div className="space-y-8">
      {docsWarning ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          The block is registered. A site file could not be uploaded. You can add it again from your land page.
        </p>
      ) : null}

      <ol className="space-y-3">
        {STEPS.map((step, index) => {
          const complete = step.done && registered;
          return (
            <li
              key={step.id}
              className="rounded-xl border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    complete
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                  {step.id === "m1" && complete ? (
                    <p className="mt-2 text-sm font-medium text-primary">Completed</p>
                  ) : null}
                  {step.id === "m4" ? (
                    <Link
                      href="/buyer/display-homes"
                      className="mt-2 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Open the display-home meeting page
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Add-on services</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {parcel
              ? `Optional reports for ${parcel.address}. A soil report and site survey before quotes usually produce a tighter estimate.`
              : "Register a block first, then request soil, survey, and other reports here."}
          </p>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your land…</p>
        ) : parcel ? (
          <ExistingLandSiteReports
            listingId={parcel.id}
            siteReports={parcel.site_reports ?? []}
            onUpdated={load}
          />
        ) : (
          <Link
            href="/buyer/my-land"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
          >
            Register your land
          </Link>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/buyer/builders"
          className={cn(buttonVariants(), "rounded-full")}
        >
          Continue to builders
        </Link>
        <Link
          href="/buyer/my-land"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
        >
          Back to your land
        </Link>
      </div>
    </div>
  );
}
