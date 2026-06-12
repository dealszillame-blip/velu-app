import { BuyerLandMap } from "@/components/maps/BuyerLandMap";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerMapPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Explore land"
        description="Vacant lots across South West Sydney — filter by suburb, price, and size."
      />
      <BuyerLandMap />
    </div>
  );
}
