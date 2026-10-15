import Link from "next/link";
import { BuyerLandMap } from "@/components/maps/BuyerLandMap";
import { PageHeader } from "@/components/shared/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BuyerMapPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="1 · Add land"
        title="Find a lot"
        description="Choose a vacant lot, then register it. That is the same first step as land you already own."
        action={
          <Link
            href="/buyer/my-land"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
          >
            Add land
          </Link>
        }
      />
      <BuyerLandMap />
    </div>
  );
}
