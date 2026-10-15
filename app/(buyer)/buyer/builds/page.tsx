import { BuyerBuilds } from "@/components/buyer/BuyerBuilds";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerBuildsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="4 · Build"
        title="Build"
        description="The contract is executed when you accept a proposal. Open a build to see the stages already done and the one that is open."
      />
      <BuyerBuilds />
    </div>
  );
}
