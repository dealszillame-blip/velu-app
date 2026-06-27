import { AdminUserEditor } from "@/components/admin/AdminUserEditor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit user</h1>
        <p className="text-muted-foreground">
          Update profile details, role, and password.
        </p>
      </div>
      <AdminUserEditor userId={id} />
    </div>
  );
}
