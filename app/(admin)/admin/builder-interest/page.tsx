import Link from "next/link";
import { AdminBuilderInterestManager } from "@/components/admin/AdminBuilderInterestManager";

export default function AdminBuilderInterestPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Builder interest</h1>
          <p className="text-muted-foreground">
            Pre-launch expression-of-interest submissions from builders.
          </p>
        </div>
        <Link href="/builders/join" className="text-sm text-link">
          View public form →
        </Link>
      </div>
      <AdminBuilderInterestManager />
    </div>
  );
}
