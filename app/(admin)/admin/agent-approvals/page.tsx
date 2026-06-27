import { AdminAgentApprovalsManager } from "@/components/admin/AdminAgentApprovalsManager";

export default function AdminAgentApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agent approvals</h1>
        <p className="text-muted-foreground">
          Review and approve land agent registration requests.
        </p>
      </div>
      <AdminAgentApprovalsManager />
    </div>
  );
}
