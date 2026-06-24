import { AuthShell } from "@/components/shared/AuthShell";
import { BuilderPrelaunchForm } from "@/components/builder/BuilderPrelaunchForm";

export default function BuilderJoinPage() {
  return (
    <AuthShell eyebrow="Builder pre-launch">
      <BuilderPrelaunchForm />
    </AuthShell>
  );
}
