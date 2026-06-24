import { AdminBuildersManager } from "@/components/admin/AdminBuildersManager";

export default function AdminBuildersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Builders</h1>
        <p className="text-muted-foreground">
          Review onboarded builders, service areas, and public profiles.
        </p>
      </div>
      <AdminBuildersManager />
    </div>
  );
}
