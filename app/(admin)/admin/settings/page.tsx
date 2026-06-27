import { AdminFeatureFlagsManager } from "@/components/admin/AdminFeatureFlagsManager";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Manage feature flags and platform configuration.
        </p>
      </div>
      <AdminFeatureFlagsManager />
    </div>
  );
}
