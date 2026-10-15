"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFECT_DESCRIPTION_MAX,
  DEFECT_TITLE_MAX,
  DEFECTS_SQL_REQUIRED,
  defectActionsFor,
  defectCreateSchema,
  defectGroupTitle,
  formatAuDate,
  groupDefects,
  parseProjectDefect,
  type DefectAction,
  type DefectRole,
  type ProjectDefect,
} from "@/lib/defects";

const ACTION_LABEL: Record<DefectAction, string> = {
  complete: "Mark fixed",
  approve: "Approve",
  reopen: "Not fixed",
};

export function DefectsPanel({
  projectId,
  role,
  defects,
  unavailable,
  loadError,
}: {
  projectId: string;
  role: DefectRole;
  defects: ProjectDefect[];
  unavailable: boolean;
  loadError: string | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState(defects);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const groups = groupDefects(items);
  const busy = pendingId !== null;

  async function readDefect(response: Response, fallback: string): Promise<ProjectDefect> {
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const message = json && typeof json.error === "string" ? json.error : fallback;
      throw new Error(message);
    }
    const defect = parseProjectDefect(json?.defect);
    if (!defect) throw new Error("Could not save that defect.");
    return defect;
  }

  async function reportDefect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role !== "buyer" || busy) return;

    const parsed = defectCreateSchema.safeParse({ title, description });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the title and description.");
      return;
    }

    setPendingId("create");
    setError(null);
    try {
      const defect = await readDefect(
        await fetch(`/api/projects/${projectId}/defects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        }),
        "Could not save that defect."
      );
      setItems((current) =>
        [...current, defect].sort((a, b) => a.created_at.localeCompare(b.created_at))
      );
      setTitle("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that defect.");
    } finally {
      setPendingId(null);
    }
  }

  async function updateDefect(defectId: string, action: DefectAction) {
    if (busy) return;
    setPendingId(`${defectId}:${action}`);
    setError(null);
    try {
      const defect = await readDefect(
        await fetch(`/api/projects/${projectId}/defects/${defectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }),
        "Could not update that defect."
      );
      setItems((current) =>
        current.map((item) => (item.id === defect.id ? defect : item))
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that defect.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="surface overflow-hidden" aria-labelledby="handover-defects-heading">
      <div className="border-b border-black/[0.06] px-5 py-4 sm:px-6">
        <p id="handover-defects-heading" className="font-medium tracking-tight">
          Defects
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {role === "buyer"
            ? "Report a defect with a short title and a description. After the builder marks it fixed, approve it or send it back with Not fixed. You cannot mark a defect complete."
            : "Mark an open defect fixed when you have repaired it. You cannot report a defect, and you cannot approve one."}
        </p>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {unavailable ? (
          <p className="text-sm text-destructive" role="alert">
            {DEFECTS_SQL_REQUIRED}
          </p>
        ) : null}
        {loadError ? (
          <p className="text-sm text-destructive" role="alert">
            {loadError}
          </p>
        ) : null}

        {role === "buyer" ? (
          <form onSubmit={reportDefect} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`defect-title-${projectId}`}>Title</Label>
              <Input
                id={`defect-title-${projectId}`}
                name="title"
                value={title}
                maxLength={DEFECT_TITLE_MAX}
                required
                autoComplete="off"
                placeholder="Cracked tile in the main bathroom"
                onChange={(event) => {
                  setTitle(event.target.value);
                  setError(null);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`defect-description-${projectId}`}>Description</Label>
              <textarea
                id={`defect-description-${projectId}`}
                name="description"
                required
                rows={3}
                maxLength={DEFECT_DESCRIPTION_MAX}
                value={description}
                placeholder="Where it is, and what you can see."
                onChange={(event) => {
                  setDescription(event.target.value);
                  setError(null);
                }}
                className="flex min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" size="sm" disabled={busy}>
              {pendingId === "create" ? "Saving…" : "Report defect"}
            </Button>
          </form>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DefectGroup
          title={defectGroupTitle("open", role)}
          defects={groups.open}
          role={role}
          busy={busy}
          pendingId={pendingId}
          onAction={updateDefect}
        />
        <DefectGroup
          title={defectGroupTitle("waiting", role)}
          defects={groups.waiting}
          role={role}
          busy={busy}
          pendingId={pendingId}
          onAction={updateDefect}
        />
        <DefectGroup
          title={defectGroupTitle("approved", role)}
          defects={groups.approved}
          role={role}
          busy={busy}
          pendingId={pendingId}
          onAction={updateDefect}
        />
      </div>
    </section>
  );
}

function DefectGroup({
  title,
  defects,
  role,
  busy,
  pendingId,
  onAction,
}: {
  title: string;
  defects: ProjectDefect[];
  role: DefectRole;
  busy: boolean;
  pendingId: string | null;
  onAction: (defectId: string, action: DefectAction) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <span className="text-xs text-muted-foreground">{defects.length}</span>
      </div>
      {defects.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">None</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {defects.map((defect) => {
            const actions = defectActionsFor(role, defect.status);
            const fixedOn = formatAuDate(defect.builder_completed_at);
            const approvedOn = formatAuDate(defect.buyer_approved_at);
            return (
              <li key={defect.id} className="rounded-xl bg-muted/40 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{defect.title}</p>
                  <Badge
                    variant={defect.status === "approved" ? "default" : "secondary"}
                    className="rounded-full"
                  >
                    {title}
                  </Badge>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {defect.description}
                </p>
                {fixedOn && defect.status !== "open" ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Builder marked this fixed on {fixedOn}.
                  </p>
                ) : null}
                {approvedOn && defect.status === "approved" ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Buyer approved this on {approvedOn}.
                  </p>
                ) : null}
                {actions.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {actions.map((action) => (
                      <Button
                        key={action}
                        type="button"
                        size="sm"
                        variant={action === "reopen" ? "outline" : "default"}
                        disabled={busy}
                        aria-label={`${ACTION_LABEL[action]} ${defect.title}`}
                        onClick={() => onAction(defect.id, action)}
                      >
                        {pendingId === `${defect.id}:${action}` ? "Saving…" : ACTION_LABEL[action]}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
