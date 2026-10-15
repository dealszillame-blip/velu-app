"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItemActive } from "@/lib/nav-active";
import { cn } from "@/lib/utils";

type TabItem = { href: string; label: string };

type MobileTabBarProps = {
  items: TabItem[];
};

export function MobileTabBar({ items }: MobileTabBarProps) {
  const pathname = usePathname();
  const roomy = items.length <= 4;

  if (items.length < 2) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-2">
        {items.map((item) => {
          const active = navItemActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                roomy
                  ? "flex flex-1 flex-col items-center justify-center gap-0.5 whitespace-nowrap px-1 text-sm font-semibold transition-colors"
                  : "flex flex-1 flex-col items-center justify-center gap-0.5 whitespace-nowrap px-1 text-xs font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "h-1 w-8 rounded-full transition-colors",
                  active ? "bg-primary" : "bg-transparent"
                )}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
