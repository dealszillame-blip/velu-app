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

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireRole(["admin"]);
  const admin = await createServiceClient();

  const [listings, userCount, builders, interest] = await Promise.all([
    admin.from("land_listings").select("id", { count: "exact", head: true }),
    countAdminUsers(admin),
    admin.from("builder_profiles").select("id", { count: "exact", head: true }),
    admin
      .from("builder_prelaunch_interest")
      .select("id", { count: "exact", head: true }),
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="text-muted-foreground">
          Manage listings, users, builders, and pre-launch signups.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
    </div>
  );
}
