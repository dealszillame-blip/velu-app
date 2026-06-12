"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

type RoleNavProps = {
  role: "buyer" | "builder" | "agent";
  items: NavItem[];
  userName: string;
};

export function RoleNav({ role, items, userName }: RoleNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const firstName = userName.split(" ")[0];

  return (
    <header className="glass-nav sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight sm:text-xl"
        >
          Velu
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          <span className="hidden text-sm text-muted-foreground md:inline">
            {firstName}
          </span>
          <button
            type="button"
            onClick={signOut}
            className="touch-target rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
