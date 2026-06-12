import { requireRole } from "@/lib/auth";
import { MobileTabBar } from "@/components/shared/MobileTabBar";
import { RoleNav } from "@/components/shared/RoleNav";

const NAV = [
  { href: "/builder/dashboard", label: "Home" },
  { href: "/builder/leads", label: "Leads" },
  { href: "/builder/proposals", label: "Proposals" },
];

export default async function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireRole(["builder"]);

  return (
    <>
      <RoleNav role="builder" items={NAV} userName={profile.full_name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        {children}
      </main>
      <MobileTabBar items={NAV} />
    </>
  );
}
