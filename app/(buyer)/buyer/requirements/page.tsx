import { BuyerRequirementsEditor } from "@/components/buyer/BuyerRequirementsEditor";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerRequirementsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="1 · Add land"
        title="Brief"
        description="Purpose, rooms, and storeys for the block you added. Add another requirement if you want more than one brief."
      />
      <BuyerRequirementsEditor />
    </div>
  );
}
