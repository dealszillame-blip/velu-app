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

  if (!profile.profile_published) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id !== id) {
      return NextResponse.json({ error: "Profile not published" }, { status: 404 });
    }
  }

  return NextResponse.json(profile);
}
