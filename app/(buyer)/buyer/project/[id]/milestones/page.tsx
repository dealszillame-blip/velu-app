import { MilestonePageContent } from "@/components/projects/MilestonePageContent";
import { redirectUnlessBuyerStep } from "@/lib/buyer-steps";

export default async function BuyerMilestonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await redirectUnlessBuyerStep("build");
  const { id } = await params;
  return (
    <MilestonePageContent
      projectId={id}
      backHref={`/buyer/project/${id}`}
    />
  );
}
