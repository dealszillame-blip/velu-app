"use client";

import { cn } from "@/lib/utils";

type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentControlProps<T>) {
  const stacked = options.length > 3;

  return (
    <div
      className={cn(
        "w-full rounded-xl bg-muted p-1",
        stacked ? "flex flex-col gap-1 sm:flex-row" : "inline-flex",
        className
      )}
      role="tablist"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-all",
              stacked ? "w-full text-left sm:flex-1 sm:text-center" : "flex-1",
              selected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
