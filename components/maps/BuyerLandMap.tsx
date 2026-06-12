"use client";

import dynamic from "next/dynamic";

export const BuyerLandMap = dynamic(
  () =>
    import("@/components/maps/LandMap").then((mod) => ({ default: mod.LandMap })),
  {
    ssr: false,
    loading: () => (
      <div className="surface flex min-h-[480px] items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  }
);
