import { AdminListingCreate } from "@/components/admin/AdminListingCreate";

export default function AdminListingNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New listing</h1>
        <p className="text-muted-foreground">
          Create a listing and optionally assign it to an agent.
        </p>
      </div>
      <AdminListingCreate />
    </div>
  );
}
