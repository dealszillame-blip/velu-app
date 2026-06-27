import { AdminUsersManager } from "@/components/admin/AdminUsersManager";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground">
          View platform users, edit profiles, and update roles.
        </p>
      </div>
      <AdminUsersManager />
    </div>
  );
}
