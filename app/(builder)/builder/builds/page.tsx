import { BuilderBuilds } from "@/components/builder/BuilderBuilds";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuilderBuildsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="3 · Builds"
        title="Builds"
        description="Jobs a buyer has accepted. Confirm the payment you received to move the open stage by one step."
      />
      <BuilderBuilds />
    </div>
  );
}
