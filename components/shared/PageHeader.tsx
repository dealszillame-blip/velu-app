type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow && (
          <p className="label-caps flex items-center gap-2">
            <span className="inline-block h-0.5 w-6 rounded-full bg-primary" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-xl text-base font-light leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
