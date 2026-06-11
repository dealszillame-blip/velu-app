import { NextResponse } from "next/server";
import { isDomainConfigured } from "@/lib/domain/auth";
import { syncDomainListings } from "@/lib/domain/sync";

function isAuthorized(request: Request): boolean {
  const secret = process.env.DOMAIN_SYNC_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isDomainConfigured()) {
    return NextResponse.json(
      {
        error:
          "Domain API not configured. Add DOMAIN_CLIENT_ID and DOMAIN_CLIENT_SECRET to .env.local",
      },
      { status: 503 }
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncDomainListings();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    configured: isDomainConfigured(),
    syncEndpoint: "POST /api/sync/domain",
    auth: "Authorization: Bearer <DOMAIN_SYNC_SECRET>",
    statuses: ["available", "under_offer", "sold"],
  });
}
