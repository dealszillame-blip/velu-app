import { AgentIntakeForm } from "@/components/listings/AgentIntakeForm";
import { requireRole } from "@/lib/auth";

export default async function AgentNewListingPage() {
  await requireRole(["agent", "pending_agent"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New listing</h1>
        <p className="text-muted-foreground">
          Address, size, frontage, price, zoning, and status.
        </p>
      </div>
      <AgentIntakeForm />
    </div>
  );
}
