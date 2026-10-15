import { DefectsPanel } from "@/components/projects/DefectsPanel";
import { HandoverWarrantyNote } from "@/components/projects/HandoverWarrantyNote";
import { defectsAvailable, type DefectRole } from "@/lib/defects";
import { readHandoverDefects } from "@/lib/defects-store";
import { createClient } from "@/lib/supabase/server";
import type { ConstructionMilestone } from "@/lib/types";

export async function PostHandoverSection({
  projectId,
  stage,
  role,
  handoverAt,
}: {
  projectId: string;
  stage: ConstructionMilestone;
  role: DefectRole;
  handoverAt: string | null;
}) {
  if (!defectsAvailable(stage)) return null;

  const supabase = await createClient();
  const { defects, unavailable, loadError } = await readHandoverDefects(
    supabase,
    projectId
  );

  return (
    <>
      <HandoverWarrantyNote handoverAt={handoverAt} />
      <DefectsPanel
        key={defects.map((defect) => `${defect.id}:${defect.status}`).join("|")}
        projectId={projectId}
        role={role}
        defects={defects}
        unavailable={unavailable}
        loadError={loadError}
      />
    </>
  );
}
