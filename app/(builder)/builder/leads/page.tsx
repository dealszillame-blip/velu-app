import { LeadFeed } from "@/components/leads/LeadFeed";
import { PageHeader } from "@/components/shared/PageHeader";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BuilderLeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Sold lots in your service area — updated live when buyers exchange."
        action={
          <Link
            href="/builder/dashboard"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
          >
            Dashboard
          </Link>
        }
      />
      <LeadFeed />
    </div>
  );
}
