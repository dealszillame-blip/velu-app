import { LeadFeed } from "@/components/leads/LeadFeed";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuilderLeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="1 · Leads"
        title="Leads"
        description="Sold lots in your area. Open one and send a proposal. Accepted proposals become builds."
      />
      <LeadFeed />
    </div>
  );
}
