import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";
import { geocodeAddress } from "@/lib/geocoding";
import type { SupabaseClient } from "@supabase/supabase-js";

export type OnboardingMetadata = {
  intended_role?: UserRole;
  full_name?: string;
  phone_number?: string;
  company_name?: string;
  license_number?: string;
  license_expiry?: string | null;
  anchor_address?: string;
  service_radius_km?: number;
  agency_licence_number?: string | null;
};

export function getOnboardingMetadata(user: User): OnboardingMetadata {
  return (user.user_metadata ?? {}) as OnboardingMetadata;
}

export async function ensureProfile(
  supabase: SupabaseClient,
  user: User
): Promise<{ role: UserRole; created: boolean }> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.role) {
    return { role: existing.role as UserRole, created: false };
  }

  const meta = getOnboardingMetadata(user);
  const role = meta.intended_role;

  if (!role || !meta.full_name) {
    throw new Error("ONBOARDING_INCOMPLETE");
  }

  if (role === "buyer") {
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      role: "buyer",
      full_name: meta.full_name,
      phone_number: meta.phone_number ?? null,
    });
    if (error) throw error;
    return { role: "buyer", created: true };
  }

  if (role === "agent") {
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      role: "agent",
      full_name: meta.full_name,
      company_name: meta.company_name ?? null,
      phone_number: meta.phone_number ?? null,
      agency_licence_number: meta.agency_licence_number ?? null,
    });
    if (error) throw error;
    return { role: "agent", created: true };
  }

  if (role === "builder") {
    if (!meta.company_name || !meta.license_number || !meta.anchor_address) {
      throw new Error("ONBOARDING_INCOMPLETE");
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      role: "builder",
      full_name: meta.full_name,
      company_name: meta.company_name,
      phone_number: meta.phone_number ?? null,
    });
    if (profileError) throw profileError;

    const { error: builderError } = await supabase.from("builder_profiles").insert({
      id: user.id,
      license_number: meta.license_number,
      license_expiry: meta.license_expiry ?? null,
      is_license_valid: true,
      service_radius_km: meta.service_radius_km ?? 25,
      anchor_address: meta.anchor_address,
      subscription_tier: "pro",
      is_onboarded: true,
      onboarding_status: "onboarded",
      onboarded_at: new Date().toISOString(),
    });
    if (builderError) throw builderError;

    const geocoded = await geocodeAddress(meta.anchor_address);
    if (geocoded) {
      await supabase.rpc("set_builder_anchor_geom", {
        p_builder_id: user.id,
        p_longitude: geocoded.longitude,
        p_latitude: geocoded.latitude,
        p_address: geocoded.placeName,
      });
    }

    return { role: "builder", created: true };
  }

  throw new Error("ONBOARDING_INCOMPLETE");
}
