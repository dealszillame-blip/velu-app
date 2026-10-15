import { MyLandDashboard } from "@/components/buyer/MyLandDashboard";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerMyLandPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="1 · Land"
        title="Land you own"
        description="Register a block you already hold. It uses the same brief, proposals, and build as a lot you find on the map."
      />
      <MyLandDashboard />
    </div>
  );
}
