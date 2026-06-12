import { requireRole } from "@/lib/auth";
import { RoleNav } from "@/components/shared/RoleNav";

const NAV = [
  { href: "/agent/listings", label: "Listings" },
  { href: "/agent/listings/new", label: "New listing" },
];

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireRole(["agent", "pending_agent"]);

  return (
    <div className="flex min-h-full flex-col bg-background">
      <RoleNav items={NAV} userName={profile.full_name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
