export function navItemActive(href: string, pathname: string): boolean {
  if (pathname.startsWith(href)) return true;
  if (
    href === "/buyer/my-land" &&
    (pathname.startsWith("/buyer/map") ||
      pathname.startsWith("/buyer/requirements") ||
      pathname.startsWith("/buyer/milestones") ||
      pathname.startsWith("/buyer/display-homes"))
  ) {
    return true;
  }
  if (href === "/buyer/builds" && pathname.startsWith("/buyer/project")) return true;
  if (href === "/builder/builds" && pathname.startsWith("/builder/project")) return true;
  return false;
}
