import Link from "next/link";
import { MyLandDashboard } from "@/components/buyer/MyLandDashboard";
import { PageHeader } from "@/components/shared/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BuyerMyLandPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="1 · Add land"
        title="Start with your land"
        description="Add the address, boundary measurements, purchase details, and the home you want. BLD-Wise uses this to line up site reports first and then ask every builder to price the same brief."
        action={
          <Link
            href="/buyer/map"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
          >
            Continue as guest
          </Link>
        }
      />
      <MyLandDashboard />
    </div>
  );
}
