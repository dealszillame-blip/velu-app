import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  hint,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "surface-subtle flex flex-col items-center px-6 py-12 text-center sm:py-16",
        className
      )}
    >
      {icon && (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--velu-green-dim)] text-primary">
          {icon}
        </div>
      )}
      <p className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </p>
      <p className="mt-2 max-w-md text-sm font-light leading-relaxed text-muted-foreground">
        {description}
      </p>
      {hint && (
        <p className="mt-4 max-w-md rounded-xl border border-border bg-muted/60 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
