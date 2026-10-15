import { BuyerRequirementsEditor } from "@/components/buyer/BuyerRequirementsEditor";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerRequirementsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="1 · Add land"
        title="Brief"
        description="Beds, baths, and storeys for the block you added. Builders see this when you invite them."
      />
      <BuyerRequirementsEditor />
    </div>
  );
}
