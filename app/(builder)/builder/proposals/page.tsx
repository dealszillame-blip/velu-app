import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BuilderProposalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My proposals</h1>
        <p className="text-muted-foreground">
          Track proposals you have submitted to buyers.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>No proposals yet</CardTitle>
          <CardDescription>
            Submit your first proposal from a lead detail page once the proposal
            engine ships.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
