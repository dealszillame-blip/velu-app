import { MyLandDashboard } from "@/components/buyer/MyLandDashboard";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerMyLandPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Already own land?"
        title="My land"
        description="Register a block you already hold and we'll connect you with licensed builders in your area — no agent listing required."
      />
      <MyLandDashboard />
    </div>
  );
}
