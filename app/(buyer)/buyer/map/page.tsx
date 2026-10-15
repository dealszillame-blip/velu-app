import Link from "next/link";
import { BuyerLandMap } from "@/components/maps/BuyerLandMap";
import { PageHeader } from "@/components/shared/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BuyerMapPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="1 · Land"
        title="Find land"
        description="Look for a vacant lot, or register a block you already own. The brief comes next."
        action={
          <Link
            href="/buyer/my-land"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
          >
            Land I own
          </Link>
        }
      />
      <BuyerLandMap />
    </div>
  );
}
