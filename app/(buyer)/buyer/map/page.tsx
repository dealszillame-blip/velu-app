import { BuyerLandMap } from "@/components/maps/BuyerLandMap";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerMapPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="The live map"
        title="Explore land"
        description="Vacant lots and licensed builders across South West Sydney. Switch layers to see land or builders in the area."
      />
      <BuyerLandMap />
    </div>
  );
}
