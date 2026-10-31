import { AuthShell } from "@/components/shared/AuthShell";
import { BuilderPrelaunchForm } from "@/components/builder/BuilderPrelaunchForm";

export default function BuilderJoinPage() {
  return (
    <AuthShell
      eyebrow="Builder pre-launch"
      title="Meet landowners who are ready to build."
      description="BLD-Wise gives builders qualified requests from NSW landowners who own their block, have entered the site facts, and are comparing a shortlist. You receive one request code, fill in one standard template, and your offer is shown beside the others in the same format."
    >
      <BuilderPrelaunchForm />
    </AuthShell>
  );
}
