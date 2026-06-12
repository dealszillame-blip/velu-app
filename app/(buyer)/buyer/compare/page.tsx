import Link from "next/link";
import { ProposalComparator } from "@/components/proposals/ProposalComparator";
import { PageHeader } from "@/components/shared/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export default function BuyerComparePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Proposals"
        description="Compare builder packages and choose your build partner."
        action={
          <Link
            href="/buyer/map"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full gap-2")}
          >
            View map
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <ProposalComparator />
    </div>
  );
}
