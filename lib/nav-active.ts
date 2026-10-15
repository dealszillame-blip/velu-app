export function navItemActive(href: string, pathname: string): boolean {
  if (pathname.startsWith(href)) return true;
  if (href === "/buyer/map" && pathname.startsWith("/buyer/my-land")) return true;
  if (href === "/buyer/builds" && pathname.startsWith("/buyer/project")) return true;
  if (href === "/builder/builds" && pathname.startsWith("/builder/project")) return true;
  return false;
}
