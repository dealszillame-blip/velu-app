import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BuyerComparePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Compare proposals</h1>
        <p className="text-muted-foreground">
          Side-by-side builder packages for your land purchase.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>No proposals yet</CardTitle>
          <CardDescription>
            When builders submit proposals on your sold lot, they will appear
            here for comparison.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
