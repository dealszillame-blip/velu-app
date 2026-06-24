function decodeJwtRole(key: string): string | null {
  if (!key.startsWith("eyJ")) {
    return null;
  }

  const parts = key.split(".");
  if (parts.length < 2) {
    return null;
  }

  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);

  try {
    const parsed = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as {
      role?: string;
    };
    return typeof parsed.role === "string" ? parsed.role : null;
  } catch {
    return null;
  }
}

export function validateServiceRoleKey(key: string): void {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (anonKey && key === anonKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is set to the anon key. Use the service_role secret from Supabase → Project Settings → API (and add it to Vercel for production)."
    );
  }

  const role = decodeJwtRole(key);
  if (role && role !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY has JWT role "${role}" but must be service_role. Copy the service_role secret from Supabase → Project Settings → API.`
    );
  }
}
