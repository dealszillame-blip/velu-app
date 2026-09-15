import { PageHeader } from "@/components/shared/PageHeader";
import { ProviderReportsPanel } from "@/components/provider/ProviderReportsPanel";

export default function ProviderReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Site report portal"
        description="Quote, progress and deliver soil reports, surveys, BAL, acoustic and third-party inspections requested by buyers."
      />
      <ProviderReportsPanel />
    </div>
  );
}
