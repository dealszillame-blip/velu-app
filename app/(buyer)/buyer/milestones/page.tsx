import { BuyerMilestones } from "@/components/buyer/BuyerMilestones";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function BuyerMilestonesPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string; docs?: string }>;
}) {
  const { listing, docs } = await searchParams;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Land to living"
        title="What happens next"
        description="Follow the path from site reports and builder comparison through contract checks, progress payments, inspections and handover. Add-on services for this block appear at the right milestone."
      />
      <BuyerMilestones listingId={listing} docsWarning={docs === "1"} />
    </div>
  );
}
