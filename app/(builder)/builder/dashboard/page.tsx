import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function BuilderDashboardPage() {
  const { user } = await requireRole(["builder"]);
  const supabase = await createClient();

  const { data: builderProfile } = await supabase
    .from("builder_profiles")
    .select("is_onboarded, anchor_address, service_radius_km, subscription_tier")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Builder dashboard</h1>
        <p className="text-muted-foreground">
          Respond to sold-lot leads and manage your proposals.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Onboarding</CardDescription>
            <CardTitle className="text-base">
              {builderProfile?.is_onboarded ? "Active" : "Pending"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={builderProfile?.is_onboarded ? "default" : "secondary"}>
              {builderProfile?.is_onboarded ? "Onboarded" : "Incomplete"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Service area</CardDescription>
            <CardTitle className="text-base">
              {builderProfile?.service_radius_km ?? 25} km radius
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {builderProfile?.anchor_address ?? "No anchor set"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Plan</CardDescription>
            <CardTitle className="text-base capitalize">
              {builderProfile?.subscription_tier ?? "free"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Billing module ships later
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead feed</CardTitle>
          <CardDescription>
            Real-time sold-lot notifications arrive in Week 3.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/builder/leads" className={buttonVariants()}>
            View lead feed
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
