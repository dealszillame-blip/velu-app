import Link from "next/link";
import { AdminListingEditor } from "@/components/admin/AdminListingEditor";

type AdminListingEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminListingEditPage({
  params,
}: AdminListingEditPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/listings" className="text-sm text-link">
          ← Back to listings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit listing</h1>
      </div>
      <AdminListingEditor listingId={id} />
    </div>
  );
}
