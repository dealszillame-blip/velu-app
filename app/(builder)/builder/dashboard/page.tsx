import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, FileText, MapPin } from "lucide-react";

export default async function BuilderDashboardPage() {
  const { user, profile } = await requireRole(["builder"]);
  const supabase = await createClient();

  const { data: builderProfile } = await supabase
    .from("builder_profiles")
    .select("is_onboarded, anchor_address, service_radius_km")
    .eq("id", user.id)
    .single();

  const { count: leadCount } = await supabase
    .from("land_listings")
    .select("*", { count: "exact", head: true })
    .eq("status", "sold");

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hello, ${profile.full_name.split(" ")[0]}`}
        description="Your command centre for sold-lot leads and proposals."
        action={
          <Link
            href="/builder/leads"
            className={cn(buttonVariants(), "rounded-full gap-2")}
          >
            Open leads
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0">
          <CardHeader className="pb-2">
            <p className="label-caps">Status</p>
            <CardTitle className="text-2xl">
              {builderProfile?.is_onboarded ? "Active" : "Setup"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="rounded-full">
              {builderProfile?.is_onboarded ? "Onboarded" : "Incomplete"}
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardHeader className="pb-2">
            <p className="label-caps">Coverage</p>
            <CardTitle className="text-2xl">
              {builderProfile?.service_radius_km ?? 25} km
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {builderProfile?.anchor_address ?? "Set your anchor address"}
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardHeader className="pb-2">
            <p className="label-caps">Sold lots</p>
            <CardTitle className="text-2xl">{leadCount ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            In database — filtered by your service area on the leads feed
          </CardContent>
        </Card>
        <Card className="border-0 bg-foreground text-background">
          <CardHeader className="pb-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-background/60">
              Next step
            </p>
            <CardTitle className="text-xl text-background">Check leads</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/builder/leads"
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "rounded-full"
              )}
            >
              Open feed
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/builder/leads" className="surface-subtle group block p-5 transition-colors hover:bg-muted/50">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <MapPin className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-medium tracking-tight group-hover:underline">
                Browse sold leads
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                View lots that sold in your area and submit build proposals.
              </p>
            </div>
          </div>
        </Link>
        <Link href="/builder/proposals" className="surface-subtle group block p-5 transition-colors hover:bg-muted/50">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-medium tracking-tight group-hover:underline">
                Your proposals
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Track submitted packages and buyer responses.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
