import Link from "next/link";
import { BuyerBuilders } from "@/components/buyer/BuyerBuilders";
import { PageHeader } from "@/components/shared/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { redirectUnlessBuyerStep } from "@/lib/buyer-steps";
import { cn } from "@/lib/utils";

export default async function BuyerBuildersPage() {
  await redirectUnlessBuyerStep("builders");
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="2 · Review builders"
        title="Matched builders"
        description="Review builders suited to your land, area and brief. Shortlist the builders you want to receive the same request code and standard template."
        action={
          <Link
            href="/buyer/milestones"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
          >
            Milestones
          </Link>
        }
      />
      <BuyerBuilders />
    </div>
  );
}
