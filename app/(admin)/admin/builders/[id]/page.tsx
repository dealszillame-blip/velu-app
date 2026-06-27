import { AdminBuilderEditor } from "@/components/admin/AdminBuilderEditor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminBuilderDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Builder verification</h1>
        <p className="text-muted-foreground">
          Review licence, onboarding status, and public profile visibility.
        </p>
      </div>
      <AdminBuilderEditor builderId={id} />
    </div>
  );
}
