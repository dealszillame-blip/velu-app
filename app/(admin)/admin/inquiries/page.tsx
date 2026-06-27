import { AdminInquiriesManager } from "@/components/admin/AdminInquiriesManager";

export default function AdminInquiriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inquiries</h1>
        <p className="text-muted-foreground">
          Support overview of buyer–builder conversations.
        </p>
      </div>
      <AdminInquiriesManager />
    </div>
  );
}
