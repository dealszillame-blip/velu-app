import { ProposalComparator } from "@/components/proposals/ProposalComparator";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerComparePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="3 · Review proposals"
        title="Proposals"
        description="Read each package. Accept one to take it to contract finalisation."
      />
      <ProposalComparator />
    </div>
  );
}
