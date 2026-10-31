"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BuildDocument = {
  id: string;
  file_name: string;
  created_at: string;
  url: string | null;
};

function formatAdded(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Sydney",
  });
}

export function BuildDocumentsPanel({
  projectId,
  canUpload,
}: {
  projectId: string;
  canUpload: boolean;
}) {
  const [documents, setDocuments] = useState<BuildDocument[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/projects/${projectId}/documents`);
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            typeof json.error === "string" ? json.error : "Could not load build documents."
          );
        }
        if (!cancelled) {
          setDocuments(Array.isArray(json.documents) ? json.documents : []);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load build documents.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function addDocument() {
    if (!file || pending) return;
    setPending(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body,
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Could not add that document.");
      }
      if (json.document) {
        setDocuments((current) => [json.document as BuildDocument, ...current]);
      }
      setFile(null);
      setFileKey((current) => current + 1);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Could not add that document.");
    } finally {
      setPending(false);
    }
  }

  async function removeDocument(documentId: string) {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: documentId }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof json.error === "string" ? json.error : "Could not remove that document."
        );
      }
      setDocuments((current) => current.filter((item) => item.id !== documentId));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove that document.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="surface-subtle overflow-hidden">
      <div className="border-b border-black/[0.06] px-5 py-4 sm:px-6">
        <p className="font-medium tracking-tight">Build documents</p>
        <p className="text-sm text-muted-foreground">
          {canUpload
            ? "Add drawings, quotes, or other files for this build. Your builder can open them here."
            : "Files the buyer added for this build."}
        </p>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        {canUpload ? (
          <div className="space-y-2">
            <Label htmlFor={`build-doc-${projectId}`}>Add a document</Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                key={fileKey}
                id={`build-doc-${projectId}`}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                disabled={pending}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <Button type="button" disabled={!file || pending} onClick={() => void addDocument()}>
                {pending ? "Saving…" : "Add to this build"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {file ? file.name : "PDF or image, up to 10 MB."}
            </p>
          </div>
        ) : null}

        {error ? (
          <p
            className={
              error.includes("not set up yet")
                ? "text-sm text-muted-foreground"
                : "text-sm text-destructive"
            }
          >
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading documents…</p>
        ) : documents.length === 0 && !error ? (
          <p className="text-sm text-muted-foreground">
            {canUpload
              ? "No documents on this build yet."
              : "The buyer has not added documents for this build yet."}
          </p>
        ) : (
          <ul className="divide-y divide-black/[0.06] rounded-xl border border-border">
            {documents.map((document) => {
              const added = formatAdded(document.created_at);
              return (
                <li
                  key={document.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{document.file_name}</p>
                    {added ? (
                      <p className="text-xs text-muted-foreground">Added {added}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {document.url ? (
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-link"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">File unavailable</span>
                    )}
                    {canUpload ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => void removeDocument(document.id)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
