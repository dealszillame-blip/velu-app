import { BuyerBuilds } from "@/components/buyer/BuyerBuilds";
import { PageHeader } from "@/components/shared/PageHeader";
import { redirectUnlessBuyerStep } from "@/lib/buyer-steps";

export default async function BuyerBuildsPage() {
  await redirectUnlessBuyerStep("build");
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="5 · Build"
        title="Build"
        description="Milestones start after the contract is final. Open a build to see the stage that is open and the ones already done."
      />
      <BuyerBuilds />
    </div>
  );
}
