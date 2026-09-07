import { NextResponse } from "next/server";
import type { BuilderPublicProfile } from "@/lib/builder-profile";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_builder_public_profile", {
    p_builder_id: id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const profile = data as BuilderPublicProfile;

  const { data: notices } = await supabase
    .from("builder_compliance_notices")
    .select("id, title, body, severity, issued_at, source")
    .eq("builder_id", id)
    .eq("is_active", true)
    .order("issued_at", { ascending: false });

  const profileWithNotices = {
    ...profile,
    notices: notices ?? [],
  };

  if (!profile.profile_published) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id !== id) {
      return NextResponse.json({ error: "Profile not published" }, { status: 404 });
    }
  }

  return NextResponse.json(profileWithNotices);
}
