"use client";

import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SegmentControl } from "@/components/shared/SegmentControl";
import {
  DEFAULT_PUBLISHED_PACKAGES,
  type PublishedPackage,
} from "@/lib/published-packages";
import { formatProposalPrice } from "@/lib/proposals";

type StoreyFilter = "all" | "single" | "double";

export function PublishedPackagesPanel() {
  const [packages, setPackages] = useState<PublishedPackage[]>(
    DEFAULT_PUBLISHED_PACKAGES
  );
  const [filter, setFilter] = useState<StoreyFilter>("all");

  useEffect(() => {
    fetch("/api/builders/published-packages")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) setPackages(data);
      })
      .catch(() => undefined);
  }, []);

  const visible = packages.filter(
    (item) => filter === "all" || item.storeys === filter
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Typical single- and double-storey packages builders publish. Live
        website ingest is stubbed until each builder opts in a catalogue feed.
      </p>
      <SegmentControl
        options={[
          { value: "all", label: "All" },
          { value: "single", label: "Single storey" },
          { value: "double", label: "Double storey" },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((item) => (
          <div
            key={item.key ?? item.name}
            className="rounded-xl border border-border p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="flex items-center gap-2 font-medium">
                <Home className="h-4 w-4 text-primary" />
                {item.name}
              </p>
              <Badge variant="outline" className="rounded-full capitalize">
                {item.storeys}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <p className="mt-3 text-sm">
              {[
                item.bedrooms != null && `${item.bedrooms} bed`,
                item.bathrooms != null && `${item.bathrooms} bath`,
                item.living_area_sqm != null && `${item.living_area_sqm} m²`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {item.indicative_price != null ? (
              <p className="mt-1 text-sm font-medium">
                From {formatProposalPrice(item.indicative_price)}
              </p>
            ) : null}
            {item.source_name ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Source: {item.source_name}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
