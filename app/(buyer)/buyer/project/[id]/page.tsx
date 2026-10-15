import { ProjectPageContent } from "@/components/projects/ProjectPageContent";
import { redirectUnlessBuyerStep } from "@/lib/buyer-steps";

export default async function BuyerProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await redirectUnlessBuyerStep("build");
  const { id } = await params;
  return <ProjectPageContent projectId={id} backHref="/buyer/builds" />;
}
