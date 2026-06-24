import Link from "next/link";
import { VeluLogo } from "@/components/shared/VeluLogo";
import { AdminNav } from "@/components/admin/AdminNav";

type AdminShellProps = {
  children: React.ReactNode;
  userName?: string | null;
};

export function AdminShell({ children, userName }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <VeluLogo size="sm" />
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {userName && <span>{userName}</span>}
            <Link href="/" className="text-link">
              View site
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-2xl border border-border bg-background p-2">
          <AdminNav />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
