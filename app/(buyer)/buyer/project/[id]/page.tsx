import { ProjectPageContent } from "@/components/projects/ProjectPageContent";

export default async function BuyerProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectPageContent projectId={id} backHref="/buyer/compare" />;
}
