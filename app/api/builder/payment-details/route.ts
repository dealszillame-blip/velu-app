import { NextResponse } from "next/server";
import {
  parsePaymentDetails,
  paymentDetailsFromRow,
  type BuilderPaymentDetails,
} from "@/lib/payment-details";
import { createClient } from "@/lib/supabase/server";

async function requireBuilder() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "builder") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, user };
}

export async function GET() {
  const auth = await requireBuilder();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase.rpc("get_own_builder_payment_details");

  if (error) {
    return NextResponse.json(
      { error: "Payment details are not available yet." },
      { status: 503 }
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json(paymentDetailsFromRow(row as BuilderPaymentDetails | null));
}

export async function PUT(request: Request) {
  const auth = await requireBuilder();
  if ("error" in auth) return auth.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter the account name, BSB, and account number." }, { status: 400 });
  }

  const body =
    json && typeof json === "object"
      ? (json as { account_name?: unknown; bsb?: unknown; account_number?: unknown })
      : {};
  const parsed = parsePaymentDetails(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data: saved, error } = await auth.supabase
    .from("builder_profiles")
    .update({
      account_name: parsed.value.account_name,
      bsb: parsed.value.bsb,
      account_number: parsed.value.account_number,
    })
    .eq("id", auth.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not save payment details." }, { status: 500 });
  }

  if (!saved) {
    return NextResponse.json(
      { error: "Complete builder onboarding first." },
      { status: 404 }
    );
  }

  return NextResponse.json(parsed.value);
}
