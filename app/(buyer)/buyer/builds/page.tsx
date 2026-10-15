import { BuyerBuilds } from "@/components/buyer/BuyerBuilds";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerBuildsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="After you accept"
        title="Builds"
        description="Each accepted proposal is an executed contract. Open a build to see the stages already completed and the stage that is open now."
      />
      <BuyerBuilds />
    </div>
  );
}
