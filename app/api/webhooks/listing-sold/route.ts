import { NextResponse } from "next/server";
import { notifyBuildersOnSold } from "@/lib/leads/notify-on-sold";

export async function POST(request: Request) {
  const secret = process.env.DOMAIN_SYNC_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const record = payload?.record;
  const oldRecord = payload?.old_record;

  if (!record?.id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (record.status !== "sold" || oldRecord?.status === "sold") {
    return NextResponse.json({ message: "Not a sale transition — skipped." });
  }

  const result = await notifyBuildersOnSold({
    id: record.id,
    land_size_sqm: record.land_size_sqm,
    suburb: record.suburb,
    postcode: record.postcode,
  });

  return NextResponse.json({ dispatched: result.dispatched });
}
