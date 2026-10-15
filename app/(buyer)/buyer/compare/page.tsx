import { ProposalComparator } from "@/components/proposals/ProposalComparator";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerComparePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="3 · Proposals"
        title="Proposals"
        description="Read the packages and accept one. Accepting it executes the contract and opens the build."
      />
      <ProposalComparator />
    </div>
  );
}
