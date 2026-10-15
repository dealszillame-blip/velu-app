import { BuyerBuilders } from "@/components/buyer/BuyerBuilders";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerBuildersPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="2 · Review builders"
        title="Builders"
        description="See who can build on your block and invite the ones you want to price it."
      />
      <BuyerBuilders />
    </div>
  );
}
