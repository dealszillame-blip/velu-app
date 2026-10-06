import { ROLE_HOME, type UserRole } from "@/lib/types";

/** Treat `/` (and empty) as “no destination” so role home is used. */
export function isGenericHomePath(path: string | null | undefined): boolean {
  if (!path) return true;
  const trimmed = path.trim();
  return trimmed === "" || trimmed === "/";
}

/** Allow only same-origin relative paths. */
export function sanitizeNextPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return null;
  }
  return trimmed;
}

/**
 * After sign-in, honour `next` / `redirect` unless it is `/`.
 * `next=/` (and a missing next) use ROLE_HOME for the signed-in role.
 */
export function getPostLoginPath(
  searchParams: URLSearchParams,
  role?: string | null
): string {
  const raw = searchParams.get("next") || searchParams.get("redirect");
  const next = sanitizeNextPath(raw);
  if (next && !isGenericHomePath(next)) {
    return next;
  }
  if (role && role in ROLE_HOME) {
    return ROLE_HOME[role as UserRole];
  }
  return "/";
}

export function getAuthCallbackUrl(nextPath?: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const path = nextPath
    ? `/auth/callback?next=${encodeURIComponent(nextPath)}`
    : "/auth/callback";
  return `${origin}${path}`;
}
