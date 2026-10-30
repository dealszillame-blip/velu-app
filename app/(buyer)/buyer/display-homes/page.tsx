import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BuyerDisplayHomesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Milestone 4"
        title="Visit display homes"
        description="When Velu has finished reviewing your quotes, the top 2 are the ones you take to a display-home meeting."
      />
      <div className="max-w-2xl space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          This page is where you decide a meeting to visit display homes. It
          opens in full once your top 2 quotes are done. Until then, Velu’s
          team is still comparing inclusions and exclusions on the quotes you
          request.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Your top 2 quotes appear here after the review in milestone 3.</li>
          <li>You choose which display homes to visit.</li>
          <li>You decide a meeting time with those builders.</li>
        </ol>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/buyer/builders"
            className={cn(buttonVariants(), "rounded-full")}
          >
            Back to builders
          </Link>
          <Link
            href="/buyer/milestones"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
          >
            Back to milestones
          </Link>
        </div>
      </div>
    </div>
  );
}
