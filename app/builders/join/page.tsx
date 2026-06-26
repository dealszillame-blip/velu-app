import { AuthShell } from "@/components/shared/AuthShell";
import { BuilderPrelaunchForm } from "@/components/builder/BuilderPrelaunchForm";

export default function BuilderJoinPage() {
  return (
    <AuthShell
      eyebrow="Builder pre-launch"
      title="Be the first builder they see — the moment their land settles."
      description="Velu connects verified builders with land buyers at the exact moment of settlement. When a buyer registers their new block, you're notified in real time and your verified profile and current packages go straight to them. No more waiting for walk-ins — reach motivated clients the day they're ready to build."
    >
      <BuilderPrelaunchForm />
    </AuthShell>
  );
}
