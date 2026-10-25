"use client";

import { Input } from "@/components/ui/input";
import { SITE_DOCUMENT_OPTIONS, type SiteDocumentKey } from "@/lib/buyer-requirements";
import { cn } from "@/lib/utils";

type SiteDocumentChecklistProps = {
  selected: SiteDocumentKey[];
  files: Partial<Record<SiteDocumentKey, File>>;
  onToggle: (key: SiteDocumentKey) => void;
  onFile: (key: SiteDocumentKey, file: File | null) => void;
  idPrefix?: string;
};

export function SiteDocumentChecklist({
  selected,
  files,
  onToggle,
  onFile,
  idPrefix = "docs",
}: SiteDocumentChecklistProps) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-border p-4">
      <legend className="px-1 text-sm font-medium">Site documents</legend>
      <p className="text-sm text-muted-foreground">
        Tick the drawings and certificates you have, then add the file if you want it saved with the block.
      </p>
      <div className="space-y-3">
        {SITE_DOCUMENT_OPTIONS.map((option) => {
          const checked = selected.includes(option.key);
          const file = files[option.key];
          return (
            <div key={option.key} className="rounded-xl border border-border px-3 py-3">
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  onChange={() => onToggle(option.key)}
                />
                <span>
                  <span className="font-medium">{option.label}</span>
                </span>
              </label>
              {checked ? (
                <div className="mt-3 space-y-1 pl-7">
                  <Input
                    id={`${idPrefix}-${option.key}`}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(event) => onFile(option.key, event.target.files?.[0] ?? null)}
                  />
                  <p className={cn("text-xs text-muted-foreground", file && "text-foreground")}>
                    {file ? file.name : "PDF or image, up to 10 MB."}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
