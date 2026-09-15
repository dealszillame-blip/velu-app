import { requireRole } from "@/lib/auth";
import { RoleNav } from "@/components/shared/RoleNav";

const NAV = [{ href: "/provider/reports", label: "Reports" }];

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireRole(["report_provider"]);

  return (
    <div className="flex min-h-full flex-col bg-background">
      <RoleNav items={NAV} userName={profile.full_name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
