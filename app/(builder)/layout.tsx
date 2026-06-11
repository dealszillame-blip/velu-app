import { requireRole } from "@/lib/auth";
import { RoleNav } from "@/components/shared/RoleNav";

const NAV = [
  { href: "/builder/dashboard", label: "Dashboard" },
  { href: "/builder/leads", label: "Lead feed" },
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
