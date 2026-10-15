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
  trailing?: NavItem[];
  userName: string;
};

export function RoleNav({ items, trailing = [], userName }: RoleNavProps) {
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

        <nav className="hidden min-w-0 items-center gap-4 md:flex" aria-label="Steps">
          {items.map((item, index) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              index={index + 1}
            />
          ))}
          {trailing.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <button
            type="button"
            className={cn(
              "touch-target rounded-full px-3 text-sm font-medium text-foreground md:hidden",
              items.length + trailing.length < 2 && "hidden"
            )}
            aria-expanded={menuOpen}
            aria-controls="role-nav-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
          <NotificationBell />
          <span className="hidden text-sm text-muted-foreground lg:inline">
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
          className="border-t border-border px-2 py-2 md:hidden"
          aria-label="Pages"
        >
          <ul>
            {[...items, ...trailing].map((item) => (
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
  index,
}: {
  item: NavItem;
  pathname: string;
  stacked?: boolean;
  index?: number;
}) {
  const active = navItemActive(item.href, pathname);
  return (
    <Link
      href={item.href}
      className={cn(
        "text-sm transition-colors",
        stacked ? "block rounded-lg px-3 py-3 font-medium" : "inline-flex items-baseline gap-2 py-2",
        active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      {index ? (
        <span className={cn("text-xs", active ? "text-foreground" : "text-muted-foreground")}>
          {index}
        </span>
      ) : null}
      {item.label}
    </Link>
  );
}
