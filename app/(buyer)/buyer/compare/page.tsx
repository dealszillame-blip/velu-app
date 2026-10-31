import { ProposalComparator } from "@/components/proposals/ProposalComparator";
import { PageHeader } from "@/components/shared/PageHeader";
import { redirectUnlessBuyerStep } from "@/lib/buyer-steps";

export default async function BuyerComparePage() {
  await redirectUnlessBuyerStep("proposals");
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="3 · Compare tenders"
        title="Compare builder answers"
        description="Review each builder on the same basis: inclusions, exclusions, allowances, site-cost assumptions, upgrade items, and the questions to ask before you sign."
      />
      <ProposalComparator />
    </div>
  );
}
