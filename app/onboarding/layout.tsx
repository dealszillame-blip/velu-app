import { AuthShell } from "@/components/shared/AuthShell";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell eyebrow="Almost there">{children}</AuthShell>;
}
