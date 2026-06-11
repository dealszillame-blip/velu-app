import {
  DOMAIN_AUTH_URL,
  DOMAIN_LISTINGS_SCOPE,
} from "@/lib/domain/config";

type CachedToken = {
  token: string;
  expiresAt: number;
};

let cached: CachedToken | null = null;

export function isDomainConfigured(): boolean {
  return Boolean(
    process.env.DOMAIN_CLIENT_ID && process.env.DOMAIN_CLIENT_SECRET
  );
}

export async function getDomainAccessToken(): Promise<string> {
  const clientId = process.env.DOMAIN_CLIENT_ID;
  const clientSecret = process.env.DOMAIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Domain API credentials missing. Set DOMAIN_CLIENT_ID and DOMAIN_CLIENT_SECRET in .env.local"
    );
  }

  const now = Date.now();
  if (cached && cached.expiresAt > now + 60_000) {
    return cached.token;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: DOMAIN_LISTINGS_SCOPE,
  });

  const res = await fetch(DOMAIN_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Domain auth failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cached = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return cached.token;
}
