import { ProjectPageContent } from "@/components/projects/ProjectPageContent";

export default async function BuilderProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectPageContent projectId={id} backHref="/builder/proposals" />;
}
