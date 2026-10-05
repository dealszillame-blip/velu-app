import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  breakdownLineSchema,
  contractTypeSchema,
  homeSpecsSchema,
  inclusionItemSchema,
} from "@/lib/proposal-schema";

const templateSchema = z.object({
  name: z.string().min(2),
  package_name: z.string().min(2),
  contract_type: contractTypeSchema.optional(),
  estimated_build_weeks: z.number().int().positive().optional(),
  notes: z.string().optional(),
  price_breakdown: z.array(breakdownLineSchema).min(1),
  inclusion_items: z.array(inclusionItemSchema).min(1),
  home_specs: homeSpecsSchema.optional(),
});

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
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user } = auth as { supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string } };

  const { data, error } = await supabase
    .from("builder_proposal_templates")
    .select("*")
    .eq("builder_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const auth = await requireBuilder();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user } = auth as { supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string } };

  const body = templateSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("builder_proposal_templates")
    .insert({
      builder_id: user.id,
      name: body.data.name,
      package_name: body.data.package_name,
      contract_type: body.data.contract_type ?? null,
      estimated_build_weeks: body.data.estimated_build_weeks ?? null,
      notes: body.data.notes ?? null,
      price_breakdown: body.data.price_breakdown,
      inclusion_items: body.data.inclusion_items,
      home_specs: body.data.home_specs ?? {},
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
