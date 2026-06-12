import { cn } from "@/lib/utils";

type StatItem = {
  label: string;
  value: string | number;
  sub?: string;
};

type StatStripProps = {
  items: StatItem[];
  className?: string;
};

export function StatStrip({ items, className }: StatStripProps) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
        items.length === 4 && "lg:grid-cols-4",
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="surface-subtle px-5 py-4">
          <p className="label-caps">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {item.value}
          </p>
          {item.sub && (
            <p className="mt-0.5 text-xs text-muted-foreground">{item.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
