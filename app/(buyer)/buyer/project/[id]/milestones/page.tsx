import { MilestonePageContent } from "@/components/projects/MilestonePageContent";

export default async function BuyerMilestonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <MilestonePageContent
      projectId={id}
      backHref={`/buyer/project/${id}`}
    />
  );
}
