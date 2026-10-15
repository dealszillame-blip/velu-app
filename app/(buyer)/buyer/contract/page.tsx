import { BuyerContracts } from "@/components/buyer/BuyerContracts";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerContractPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="4 · Contract"
        title="Contract"
        description="The proposal you accept is the contract. Check the type, the price, and the builder before the build milestones start."
      />
      <BuyerContracts />
    </div>
  );
}
