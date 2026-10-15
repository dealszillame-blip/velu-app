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
        title="Add land"
        description="Register the block you want to build on. Add the brief, then invite builders."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/buyer/requirements"
              className={cn(buttonVariants(), "rounded-full")}
            >
              Add the brief
            </Link>
            <Link
              href="/buyer/map"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
            >
              Find a lot
            </Link>
          </div>
        }
      />
      <MyLandDashboard />
    </div>
  );
}
