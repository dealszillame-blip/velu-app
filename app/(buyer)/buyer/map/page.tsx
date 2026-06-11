import { BuyerLandMap } from "@/components/maps/BuyerLandMap";

export default function BuyerMapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Land map</h1>
        <p className="text-muted-foreground">
          Browse available vacant lots across South West Sydney. Filter by
          suburb, price, and size.
        </p>
      </div>
      <BuyerLandMap />
    </div>
  );
}
