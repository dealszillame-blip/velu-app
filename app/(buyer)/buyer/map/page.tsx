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
        title="Vacant lots"
        description="Look through vacant lots without registering a block. Register your land when you are ready."
        action={
          <Link
            href="/buyer/my-land"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
          >
            Register your land
          </Link>
        }
      />
      <BuyerLandMap />
    </div>
  );
}
