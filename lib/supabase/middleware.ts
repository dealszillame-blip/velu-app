import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

const ROLE_HOME: Record<string, string> = {
  buyer: "/buyer/map",
  builder: "/builder/dashboard",
  agent: "/agent/listings",
  admin: "/admin/dashboard",
  pending_agent: "/agent/listings",
};

/** Public routes that share a prefix with a protected app area (e.g. /builders vs /builder). */
const PUBLIC_PREFIXES = ["/builders"];

function isPublicPath(path: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function isProtectedPath(path: string): boolean {
  if (isPublicPath(path)) {
    return false;
  }

  return (
    path === "/builder" ||
    path.startsWith("/builder/") ||
    path.startsWith("/buyer") ||
    path.startsWith("/agent") ||
    path.startsWith("/admin")
  );
}

const AUTH_PREFIXES = ["/login", "/register", "/verify", "/forgot-password", "/auth/callback"];
const ONBOARDING_PREFIXES = ["/onboarding"];

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const env = getSupabaseEnv();

  // Missing Supabase config on Vercel — allow public pages instead of crashing.
  if (!env) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
  const supabase = createServerClient(
    env.url,
    env.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // API routes handle their own auth — never redirect them to HTML pages
  if (path.startsWith("/api")) {
    return supabaseResponse;
  }

  const isProtected = isProtectedPath(path);
  const isAuthRoute = AUTH_PREFIXES.some((prefix) => path.startsWith(prefix));
  const isOnboardingRoute = ONBOARDING_PREFIXES.some((prefix) =>
    path.startsWith(prefix)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role ?? null;

    if (isAuthRoute && role) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role] ?? "/buyer/map";
      return NextResponse.redirect(url);
    }

    if (path === "/") {
      const url = request.nextUrl.clone();
      url.pathname = role
        ? (ROLE_HOME[role] ?? "/buyer/map")
        : "/onboarding/complete";
      return NextResponse.redirect(url);
    }

    if (isOnboardingRoute && role) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role] ?? "/buyer/map";
      return NextResponse.redirect(url);
    }

    if (isAuthRoute && user && !role) {
      return supabaseResponse;
    }

    if (role && isProtected) {
      const expectedPrefix = `/${role === "pending_agent" ? "agent" : role}`;
      if (!path.startsWith(expectedPrefix) && role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = ROLE_HOME[role] ?? "/buyer/map";
        return NextResponse.redirect(url);
      }
    }

    if (isProtected && !role) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding/complete";
      return NextResponse.redirect(url);
    }

    if (!role && !isOnboardingRoute && !isAuthRoute && !isPublicPath(path) && path !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding/complete";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
  } catch (error) {
    console.error("Middleware session error:", error);
    return NextResponse.next({ request });
  }
}
