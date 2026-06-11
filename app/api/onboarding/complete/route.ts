import { NextResponse } from "next/server";
import { ensureProfile } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME } from "@/lib/types";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { role, created } = await ensureProfile(supabase, user);
    return NextResponse.json({
      ok: true,
      role,
      created,
      redirect: ROLE_HOME[role],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "ONBOARDING_INCOMPLETE") {
      return NextResponse.json(
        {
          error: "Profile not set up yet. Please complete registration.",
          code: "ONBOARDING_INCOMPLETE",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
