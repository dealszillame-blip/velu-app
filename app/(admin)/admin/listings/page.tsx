import { AdminListingsManager } from "@/components/admin/AdminListingsManager";

export default function AdminListingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Listings</h1>
        <p className="text-muted-foreground">
          Manage all properties on the Velu map and lead pipeline.
        </p>
      </div>
      <AdminListingsManager />
    </div>
  );
}
