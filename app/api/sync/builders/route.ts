import { NextResponse } from "next/server";
import { runWeeklyBuilderUpdate } from "@/lib/nsw-builders-weekly";
import { createServiceClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secrets = [
    process.env.CRON_SECRET,
    process.env.BUILDER_SYNC_SECRET,
    process.env.DOMAIN_SYNC_SECRET,
  ].filter((value): value is string => Boolean(value?.trim()));

  if (secrets.length === 0) return false;

  const auth = request.headers.get("authorization");
  return secrets.some((secret) => auth === `Bearer ${secret}`);
}

async function runCronUpdate() {
  const admin = await createServiceClient();
  return runWeeklyBuilderUpdate(admin, { mode: "cron" });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        hint: "Set CRON_SECRET or BUILDER_SYNC_SECRET and send Authorization: Bearer <secret>.",
      },
      { status: 401 }
    );
  }

  try {
    const result = await runCronUpdate();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Builder sync failed";
    return NextResponse.json(
      {
        error: message.includes("nsw_licensed_builders")
          ? "Run migrations/mvp/027_nsw_builder_directory.sql in the Supabase SQL Editor (SQL file only, not npm run …)."
          : message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
