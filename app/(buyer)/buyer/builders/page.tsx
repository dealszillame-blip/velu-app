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
        title="Builders"
        description="The 10 nearest Velu verified builders for your block, closest first. Open a name to see their profile, inclusions, offers, and photos."
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
