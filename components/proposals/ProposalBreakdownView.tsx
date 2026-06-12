"use client";

import {
  BREAKDOWN_CATEGORIES,
  INCLUSION_CATEGORIES,
  categoryLabel,
  type InclusionItem,
  type PriceBreakdownLine,
} from "@/lib/proposal-breakdown";
import { formatProposalPrice, type ProposalRow } from "@/lib/proposals";
import { cn } from "@/lib/utils";

export function ProposalHomeSpecs({ specs }: { specs: ProposalRow["home_specs"] }) {
  if (!specs || Object.keys(specs).length === 0) return null;

  const items = [
    specs.bedrooms != null && `${specs.bedrooms} bed`,
    specs.bathrooms != null && `${specs.bathrooms} bath`,
    specs.car_spaces != null && `${specs.car_spaces} car`,
    specs.living_area_sqm != null && `${specs.living_area_sqm} m² living`,
    specs.storeys != null && `${specs.storeys} storey`,
  ].filter((item): item is string => Boolean(item));

  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function ProposalBreakdownTable({
  lines,
  compact = false,
}: {
  lines: PriceBreakdownLine[];
  compact?: boolean;
}) {
  if (!lines?.length) return null;

  return (
    <div className={cn("overflow-hidden rounded-xl bg-muted/30", compact && "text-xs")}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/[0.06] text-left">
            <th className="px-3 py-2 font-medium">Item</th>
            <th className="px-3 py-2 text-right font-medium">Est.</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="border-b border-black/[0.04] last:border-0">
              <td className="px-3 py-2">
                <span className="text-muted-foreground">
                  {categoryLabel(BREAKDOWN_CATEGORIES, line.category)} ·{" "}
                </span>
                {line.label}
              </td>
              <td className="px-3 py-2 text-right font-medium tabular-nums">
                {formatProposalPrice(line.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProposalInclusionsList({
  items,
  compact = false,
}: {
  items: InclusionItem[];
  compact?: boolean;
}) {
  if (!items?.length) return null;

  const grouped = INCLUSION_CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className={cn("space-y-3", compact && "text-xs")}>
      {grouped.map((group) => (
        <div key={group.value}>
          <p className="label-caps mb-1.5">{group.label}</p>
          <ul className="space-y-1.5">
            {group.items.map((item, i) => (
              <li
                key={i}
                className={cn(
                  "flex gap-2 rounded-lg px-2 py-1.5",
                  item.included ? "bg-muted/50" : "opacity-50 line-through"
                )}
              >
                <span className="shrink-0">{item.included ? "✓" : "—"}</span>
                <span>
                  <span className="font-medium">{item.item}</span>
                  {item.detail && (
                    <span className="text-muted-foreground"> — {item.detail}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function ProposalComparisonGrid({ proposals }: { proposals: ProposalRow[] }) {
  if (proposals.length < 2) return null;

  const allBreakdownLabels = [
    ...new Set(
      proposals.flatMap((p) =>
        (p.price_breakdown ?? []).map((l) => `${l.category}::${l.label}`)
      )
    ),
  ];

  const allInclusionKeys = [
    ...new Set(
      proposals.flatMap((p) =>
        (p.inclusion_items ?? []).map((i) => `${i.category}::${i.item}`)
      )
    ),
  ];

  return (
    <div className="surface-subtle overflow-x-auto p-4 sm:p-6">
      <p className="label-caps mb-4">Side-by-side comparison</p>

      {/* Price breakdown matrix */}
      {allBreakdownLabels.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium">Price breakdown (est.)</p>
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="py-2 text-left font-medium">Line item</th>
                {proposals.map((p) => (
                  <th key={p.id} className="px-3 py-2 text-right font-medium">
                    {p.builder_name ?? "Builder"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allBreakdownLabels.map((key) => {
                const [, ...labelParts] = key.split("::");
                const label = labelParts.join("::");
                return (
                  <tr key={key} className="border-b border-black/[0.04]">
                    <td className="py-2 pr-4 text-muted-foreground">{label}</td>
                    {proposals.map((p) => {
                      const line = (p.price_breakdown ?? []).find(
                        (l) => `${l.category}::${l.label}` === key
                      );
                      return (
                        <td key={p.id} className="px-3 py-2 text-right tabular-nums">
                          {line ? formatProposalPrice(line.amount) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="font-semibold">
                <td className="py-2">Total (est.)</td>
                {proposals.map((p) => (
                  <td key={p.id} className="px-3 py-2 text-right tabular-nums">
                    {formatProposalPrice(p.base_price)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Inclusions matrix */}
      {allInclusionKeys.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Inclusions</p>
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="py-2 text-left font-medium">Item</th>
                {proposals.map((p) => (
                  <th key={p.id} className="px-3 py-2 text-center font-medium">
                    {p.builder_name ?? "Builder"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allInclusionKeys.map((key) => {
                const [, ...itemParts] = key.split("::");
                const itemName = itemParts.join("::");
                return (
                  <tr key={key} className="border-b border-black/[0.04]">
                    <td className="py-2 pr-4">{itemName}</td>
                    {proposals.map((p) => {
                      const item = (p.inclusion_items ?? []).find(
                        (i) => `${i.category}::${i.item}` === key
                      );
                      return (
                        <td key={p.id} className="px-3 py-2 text-center">
                          {item ? (item.included ? "✓" : "—") : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
