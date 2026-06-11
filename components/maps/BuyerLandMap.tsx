"use client";

import dynamic from "next/dynamic";

export const BuyerLandMap = dynamic(
  () =>
    import("@/components/maps/LandMap").then((mod) => ({ default: mod.LandMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[480px] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  }
);
