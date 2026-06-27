import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { countAdminUsers } from "@/lib/admin/users";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireRole(["admin"]);
  const admin = await createServiceClient();

  const [
    listings,
    userCount,
    builders,
    interest,
    pendingAgents,
    pendingBuilders,
    newInterest,
    inquiries,
    proposals,
    recentListings,
    recentUsers,
  ] = await Promise.all([
    admin.from("land_listings").select("id", { count: "exact", head: true }),
    countAdminUsers(admin),
    admin.from("builder_profiles").select("id", { count: "exact", head: true }),
    admin
      .from("builder_prelaunch_interest")
      .select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "pending_agent"),
    admin
      .from("builder_profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_onboarded", false),
    admin
      .from("builder_prelaunch_interest")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    admin
      .from("builder_inquiries")
      .select("id", { count: "exact", head: true }),
    admin
      .from("builder_proposals")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "viewed"]),
    admin
      .from("land_listings")
      .select("id, address, suburb, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: "Listings", count: listings.count ?? 0, href: "/admin/listings" },
    { label: "Users", count: userCount, href: "/admin/users" },
    { label: "Builders", count: builders.count ?? 0, href: "/admin/builders" },
    {
      label: "Builder interest",
      count: interest.count ?? 0,
      href: "/admin/builder-interest",
    },
    {
      label: "Inquiries",
      count: inquiries.count ?? 0,
      href: "/admin/inquiries",
    },
    {
      label: "Open proposals",
      count: proposals.count ?? 0,
      href: "/admin/proposals",
    },
  ];

  const alerts = [
    {
      label: "Pending agent approvals",
      count: pendingAgents.count ?? 0,
      href: "/admin/agent-approvals",
      urgent: (pendingAgents.count ?? 0) > 0,
    },
    {
      label: "Builders awaiting onboarding",
      count: pendingBuilders.count ?? 0,
      href: "/admin/builders",
      urgent: (pendingBuilders.count ?? 0) > 0,
    },
    {
      label: "New builder interest",
      count: newInterest.count ?? 0,
      href: "/admin/builder-interest",
      urgent: (newInterest.count ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview, pending approvals, and recent activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{stat.count}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Needs attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert) => (
            <Link
              key={alert.label}
              href={alert.href}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <span className="text-sm">{alert.label}</span>
              <Badge variant={alert.urgent ? "default" : "outline"}>
                {alert.count}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent listings</CardTitle>
            <Link href="/admin/listings" className="text-sm text-link">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentListings.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No listings yet.</p>
            ) : (
              (recentListings.data ?? []).map((listing) => (
                <Link
                  key={listing.id}
                  href={`/admin/listings/${listing.id}`}
                  className="block rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <p className="font-medium">{listing.address}</p>
                  <p className="text-muted-foreground">
                    {listing.suburb} · {listing.status}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent signups</CardTitle>
            <Link href="/admin/users" className="text-sm text-link">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentUsers.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              (recentUsers.data ?? []).map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="block rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-muted-foreground capitalize">
                    {user.role}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
