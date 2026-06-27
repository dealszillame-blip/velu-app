import { AdminProposalsManager } from "@/components/admin/AdminProposalsManager";

export default function AdminProposalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Proposals</h1>
        <p className="text-muted-foreground">
          Support overview of builder proposals across the platform.
        </p>
      </div>
      <AdminProposalsManager />
    </div>
  );
}
