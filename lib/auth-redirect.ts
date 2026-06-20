export function getPostLoginPath(searchParams: URLSearchParams): string {
  return (
    searchParams.get("next") ||
    searchParams.get("redirect") ||
    "/"
  );
}

export function getAuthCallbackUrl(nextPath?: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const path = nextPath ? `/auth/callback?next=${encodeURIComponent(nextPath)}` : "/auth/callback";
  return `${origin}${path}`;
}
