export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 px-4 pt-4 pb-4 md:px-8 md:pt-8 md:pb-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {description && <p className="text-sm text-muted-foreground md:text-base">{description}</p>}
    </div>
  );
}
