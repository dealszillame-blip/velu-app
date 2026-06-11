import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BuilderLeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lead feed</h1>
        <p className="text-muted-foreground">
          Newly sold vacant lots within your service radius.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>No leads yet</CardTitle>
          <CardDescription>
            Supabase Realtime subscriptions on sold listings will populate this
            feed in Week 3.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
