import { requireRole } from "@/lib/auth";
import { RoleNav } from "@/components/shared/RoleNav";

const NAV = [
  { href: "/buyer/map", label: "Land map" },
  { href: "/buyer/compare", label: "Compare" },
];

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireRole(["buyer"]);

  return (
    <>
      <RoleNav role="buyer" items={NAV} userName={profile.full_name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
