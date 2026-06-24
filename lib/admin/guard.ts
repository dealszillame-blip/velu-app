import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function requireAdminApi() {
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

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  try {
    const admin = await createServiceClient();
    return { user, admin };
  } catch {
    return {
      error: NextResponse.json(
        {
          error:
            "Admin API is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your environment (Vercel → Settings → Environment Variables).",
        },
        { status: 503 }
      ),
    };
  }
}
