import { MilestonePageContent } from "@/components/projects/MilestonePageContent";

export default async function BuilderMilestonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <MilestonePageContent
      projectId={id}
      backHref={`/builder/project/${id}`}
    />
  );
}
