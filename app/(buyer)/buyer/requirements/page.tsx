import { BuyerRequirementsEditor } from "@/components/buyer/BuyerRequirementsEditor";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerRequirementsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="2 · Brief"
        title="Brief"
        description="Beds, baths, storeys, and the block. Builders see this when they price your land."
      />
      <BuyerRequirementsEditor />
    </div>
  );
}
