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
        eyebrow="After your land"
        title="What happens next"
        description="These are the milestones from here to a display-home visit. Add-on services for this block sit on this page."
      />
      <BuyerMilestones listingId={listing} docsWarning={docs === "1"} />
    </div>
  );
}
