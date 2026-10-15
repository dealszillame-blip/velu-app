import { requireRole } from "@/lib/auth";
import { MobileTabBar } from "@/components/shared/MobileTabBar";
import { RoleNav } from "@/components/shared/RoleNav";

const NAV = [
  { href: "/buyer/my-land", label: "Land" },
  { href: "/buyer/builders", label: "Builders" },
  { href: "/buyer/compare", label: "Proposals" },
  { href: "/buyer/contract", label: "Contract" },
  { href: "/buyer/builds", label: "Build" },
];

const MENU = [...NAV, { href: "/buyer/messages", label: "Messages" }];

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireRole(["buyer"]);

  return (
    <div className="flex min-h-full flex-col bg-background">
      <RoleNav items={MENU} userName={profile.full_name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        {children}
      </main>
      <MobileTabBar items={NAV} />
    </div>
  );
}
