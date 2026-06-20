import { BuyerRequirementsEditor } from "@/components/buyer/BuyerRequirementsEditor";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerRequirementsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Your brief"
        title="Build requirements"
        description="Storeys, granny flat, bedrooms, bathrooms — shared with builders when you register land or receive proposals."
      />
      <BuyerRequirementsEditor />
    </div>
  );
}
