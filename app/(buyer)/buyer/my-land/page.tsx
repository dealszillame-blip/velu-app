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
        title="Register your land"
        description="Add the block and what you want built, or continue as a guest and look at vacant lots."
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
