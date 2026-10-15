"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { VeluLogo } from "@/components/shared/VeluLogo";
import { navItemActive } from "@/lib/nav-active";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

type RoleNavProps = {
  items: NavItem[];
  userName: string;
};

export function RoleNav({ items, userName }: RoleNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = userName.split(" ")[0];
  const homeHref =
    items[0]?.href.split("/").slice(0, 3).join("/") ?? "/";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="glass-nav sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <VeluLogo href={homeHref} size="sm" />

        <nav className="hidden items-center gap-1 lg:flex">
          {items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <button
            type="button"
            className="touch-target rounded-full px-3 text-sm font-medium text-foreground lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="role-nav-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
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

      {menuOpen ? (
        <nav
          id="role-nav-menu"
          className="border-t border-border px-2 py-2 lg:hidden"
          aria-label="Pages"
        >
          <ul>
            {items.map((item) => (
              <li key={item.href}>
                <NavLink item={item} pathname={pathname} stacked />
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function NavLink({
  item,
  pathname,
  stacked = false,
}: {
  item: NavItem;
  pathname: string;
  stacked?: boolean;
}) {
  const active = navItemActive(item.href, pathname);
  return (
    <Link
      href={item.href}
      className={cn(
        "block text-sm font-medium transition-colors",
        stacked
          ? "rounded-lg px-3 py-3"
          : "rounded-full px-4 py-2",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-muted"
      )}
      aria-current={active ? "page" : undefined}
    >
      {item.label}
    </Link>
  );
}
