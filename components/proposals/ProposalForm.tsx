"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatProposalPrice } from "@/lib/proposals";
import {
  BREAKDOWN_CATEGORIES,
  INCLUSION_CATEGORIES,
  type InclusionItem,
  type PriceBreakdownLine,
  type ProposalFormState,
  type ProposalTemplate,
  emptyFormState,
  formatInclusionsSummary,
  sumBreakdown,
  templateToFormState,
} from "@/lib/proposal-breakdown";
import { BookmarkPlus, Loader2, Plus, Trash2 } from "lucide-react";

type ProposalFormProps = {
  listingId: string;
};

function Textarea({
  id,
  placeholder,
  value,
  onChange,
  rows = 3,
}: {
  id: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "flex w-full resize-none rounded-xl border-0 bg-muted/60 px-3 py-2.5 text-sm",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    />
  );
}

export function ProposalForm({ listingId }: ProposalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateName, setTemplateName] = useState("");
  const [form, setForm] = useState<ProposalFormState>(emptyFormState);

  const breakdownTotal = useMemo(
    () => sumBreakdown(form.price_breakdown),
    [form.price_breakdown]
  );

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    const res = await fetch("/api/proposals/templates");
    const data = await res.json();
    setTemplatesLoading(false);
    if (res.ok) setTemplates(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  function updateForm(patch: Partial<ProposalFormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function updateBreakdown(index: number, patch: Partial<PriceBreakdownLine>) {
    setForm((f) => ({
      ...f,
      price_breakdown: f.price_breakdown.map((line, i) =>
        i === index ? { ...line, ...patch } : line
      ),
    }));
  }

  function addBreakdownLine() {
    setForm((f) => ({
      ...f,
      price_breakdown: [
        ...f.price_breakdown,
        { category: "other", label: "", amount: 0 },
      ],
    }));
  }

  function removeBreakdownLine(index: number) {
    setForm((f) => ({
      ...f,
      price_breakdown: f.price_breakdown.filter((_, i) => i !== index),
    }));
  }

  function updateInclusion(index: number, patch: Partial<InclusionItem>) {
    setForm((f) => ({
      ...f,
      inclusion_items: f.inclusion_items.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));
  }

  function addInclusion() {
    setForm((f) => ({
      ...f,
      inclusion_items: [
        ...f.inclusion_items,
        { category: "other", item: "", detail: "", included: true },
      ],
    }));
  }

  function removeInclusion(index: number) {
    setForm((f) => ({
      ...f,
      inclusion_items: f.inclusion_items.filter((_, i) => i !== index),
    }));
  }

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    if (!templateId || templateId === "blank") {
      setForm(emptyFormState());
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    if (template) setForm(templateToFormState(template));
  }

  async function saveTemplate() {
    if (!templateName.trim()) {
      setError("Enter a template name before saving.");
      return;
    }
    setSavingTemplate(true);
    setError(null);
    const res = await fetch("/api/proposals/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: templateName.trim(),
        package_name: form.package_name || "Untitled package",
        estimated_build_weeks: form.estimated_build_weeks
          ? Number(form.estimated_build_weeks)
          : undefined,
        notes: form.notes || undefined,
        price_breakdown: form.price_breakdown,
        inclusion_items: form.inclusion_items,
        home_specs: form.home_specs,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingTemplate(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save template");
      return;
    }
    setTemplateName("");
    await loadTemplates();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const total =
      breakdownTotal > 0 ? breakdownTotal : Number(form.base_price);
    if (!total || total <= 0) {
      setError("Enter estimated costs in the breakdown or a total price.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        land_listing_id: listingId,
        package_name: form.package_name,
        base_price: total,
        inclusions: formatInclusionsSummary(form.inclusion_items),
        estimated_build_weeks: form.estimated_build_weeks
          ? Number(form.estimated_build_weeks)
          : undefined,
        notes: form.notes || undefined,
        price_breakdown: form.price_breakdown,
        inclusion_items: form.inclusion_items,
        home_specs: form.home_specs,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to submit proposal");
      return;
    }

    router.push("/builder/proposals");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Templates */}
      <div className="surface-subtle space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <BookmarkPlus className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-medium tracking-tight">Templates</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Load saved template</Label>
            <Select
              value={selectedTemplateId || "blank"}
              onValueChange={(value) => {
                if (value) applyTemplate(value);
              }}
              disabled={templatesLoading}
            >
              <SelectTrigger className="h-11 rounded-xl border-0 bg-muted">
                <SelectValue placeholder={templatesLoading ? "Loading…" : "Start from scratch"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Start from scratch</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="template_name">Save current as template</Label>
            <div className="flex gap-2">
              <Input
                id="template_name"
                placeholder="e.g. Standard 4-bed package"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0 rounded-full"
                disabled={savingTemplate}
                onClick={saveTemplate}
              >
                {savingTemplate ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          All figures are estimates for buyer comparison — not fixed quotes.
        </p>
      </div>

      {/* Package + home specs */}
      <div className="space-y-4">
        <p className="label-caps">Package overview</p>
        <div className="space-y-2">
          <Label htmlFor="package_name">Design / package name</Label>
          <Input
            id="package_name"
            required
            placeholder="e.g. The Camden 240"
            value={form.package_name}
            onChange={(e) => updateForm({ package_name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              ["bedrooms", "Beds", 1],
              ["bathrooms", "Baths", 1],
              ["car_spaces", "Cars", 0],
              ["living_area_sqm", "Living m²", 1],
              ["storeys", "Storeys", 1],
            ] as const
          ).map(([key, label, min]) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <Input
                type="number"
                min={min}
                value={form.home_specs[key] ?? ""}
                onChange={(e) =>
                  updateForm({
                    home_specs: {
                      ...form.home_specs,
                      [key]: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label className="text-xs">Build weeks (est.)</Label>
            <Input
              type="number"
              min={1}
              placeholder="32"
              value={form.estimated_build_weeks}
              onChange={(e) => updateForm({ estimated_build_weeks: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="space-y-4 border-t border-black/[0.06] pt-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label-caps">Estimated price breakdown</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Itemise costs so buyers can compare line by line.
            </p>
          </div>
          <p className="text-xl font-semibold tracking-tight">
            {formatProposalPrice(breakdownTotal)}
          </p>
        </div>

        <div className="space-y-2">
          {form.price_breakdown.map((line, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-xl bg-muted/40 p-3 sm:grid-cols-[140px_1fr_120px_32px]"
            >
              <Select
                value={line.category}
                onValueChange={(v) => {
                  if (v) updateBreakdown(index, { category: v });
                }}
              >
                <SelectTrigger className="h-10 rounded-lg border-0 bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BREAKDOWN_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Line item description"
                value={line.label}
                onChange={(e) => updateBreakdown(index, { label: e.target.value })}
              />
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min={0}
                  className="pl-5"
                  value={line.amount || ""}
                  onChange={(e) =>
                    updateBreakdown(index, {
                      amount: e.target.value ? Number(e.target.value) : 0,
                    })
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 shrink-0 rounded-full p-0"
                onClick={() => removeBreakdownLine(index)}
                aria-label="Remove line"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full gap-1.5"
          onClick={addBreakdownLine}
        >
          <Plus className="h-4 w-4" />
          Add line item
        </Button>
      </div>

      {/* Inclusions */}
      <div className="space-y-4 border-t border-black/[0.06] pt-5">
        <div>
          <p className="label-caps">Inclusions checklist</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Show exactly what is included — buyers compare this side by side.
          </p>
        </div>
        <div className="space-y-2">
          {form.inclusion_items.map((item, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-xl bg-muted/40 p-3 sm:grid-cols-[130px_1fr_1fr_80px_32px] sm:items-center"
            >
              <Select
                value={item.category}
                onValueChange={(v) => {
                  if (v) updateInclusion(index, { category: v });
                }}
              >
                <SelectTrigger className="h-10 rounded-lg border-0 bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCLUSION_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Inclusion item"
                value={item.item}
                onChange={(e) => updateInclusion(index, { item: e.target.value })}
              />
              <Input
                placeholder="Detail / allowance"
                value={item.detail}
                onChange={(e) => updateInclusion(index, { detail: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.included}
                  onChange={(e) =>
                    updateInclusion(index, { included: e.target.checked })
                  }
                  className="rounded"
                />
                Included
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 shrink-0 rounded-full p-0"
                onClick={() => removeInclusion(index)}
                aria-label="Remove inclusion"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full gap-1.5"
          onClick={addInclusion}
        >
          <Plus className="h-4 w-4" />
          Add inclusion
        </Button>
      </div>

      {/* Notes */}
      <div className="space-y-2 border-t border-black/[0.06] pt-5">
        <Label htmlFor="notes">Notes for buyer</Label>
        <Textarea
          id="notes"
          placeholder="Fixed-price contract terms, provisional sum notes, warranty details…"
          value={form.notes}
          onChange={(v) => updateForm({ notes: v })}
          rows={3}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="h-12 w-full rounded-full text-base">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          `Submit proposal — ${formatProposalPrice(breakdownTotal)}`
        )}
      </Button>
    </form>
  );
}
