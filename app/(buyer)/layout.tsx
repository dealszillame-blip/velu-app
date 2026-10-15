import { requireRole } from "@/lib/auth";
import { loadBuyerAccess, type BuyerStepId } from "@/lib/buyer-steps";
import { MobileTabBar } from "@/components/shared/MobileTabBar";
import { RoleNav } from "@/components/shared/RoleNav";

const STEPS: { id: BuyerStepId; href: string; label: string }[] = [
  { id: "land", href: "/buyer/my-land", label: "Land" },
  { id: "builders", href: "/buyer/builders", label: "Builders" },
  { id: "proposals", href: "/buyer/compare", label: "Proposals" },
  { id: "contract", href: "/buyer/contract", label: "Contract" },
  { id: "build", href: "/buyer/builds", label: "Build" },
];

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireRole(["buyer"]);
  const access = await loadBuyerAccess(user.id);
  const steps = STEPS.filter((step) => access[step.id]).map(({ href, label }) => ({
    href,
    label,
  }));
  const trailing = access.messages
    ? [{ href: "/buyer/messages", label: "Messages" }]
    : [];

  return (
    <div className="flex min-h-full flex-col bg-background">
      <RoleNav items={steps} trailing={trailing} userName={profile.full_name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-10">
        {children}
      </main>
      <MobileTabBar items={steps} />
    </div>
  );
}
