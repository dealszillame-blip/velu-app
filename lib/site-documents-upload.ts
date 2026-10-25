import type { SiteDocumentKey } from "@/lib/buyer-requirements";

export async function uploadSiteDocuments(
  listingId: string,
  files: Partial<Record<SiteDocumentKey, File>>
): Promise<string | null> {
  const entries = Object.entries(files).filter((entry): entry is [SiteDocumentKey, File] =>
    Boolean(entry[1])
  );
  if (!entries.length) return null;

  const failures: string[] = [];
  for (const [key, file] of entries) {
    const body = new FormData();
    body.set("listing_id", listingId);
    body.set("key", key);
    body.set("file", file);
    const res = await fetch("/api/buyer/land/documents", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      failures.push(data.error ?? `Could not save ${file.name}.`);
    }
  }
  return failures.length ? failures[0] : null;
}
