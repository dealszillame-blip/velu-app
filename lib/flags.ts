import { createClient } from "@/lib/supabase/server";

export async function getFlags(): Promise<Record<string, boolean>> {
  const supabase = await createClient();
  const { data } = await supabase.from("feature_flags").select("key, enabled");

  return Object.fromEntries((data ?? []).map((f) => [f.key, f.enabled]));
}

export async function isFlagEnabled(key: string): Promise<boolean> {
  const flags = await getFlags();
  return flags[key] ?? false;
}
