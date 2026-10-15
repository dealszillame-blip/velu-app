import { MyLandDashboard } from "@/components/buyer/MyLandDashboard";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerMyLandPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="1 · Add land"
        title="Add land"
        description="Register the block you want to build on. The next step appears after this block is saved."
      />
      <MyLandDashboard />
    </div>
  );
}
