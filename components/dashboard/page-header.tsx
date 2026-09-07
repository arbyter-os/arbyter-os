export function PageHeader({
  greeting,
  title,
  description,
  actions,
}: {
  greeting?: string
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {greeting ? (
          <p className="text-sm font-medium text-primary">{greeting}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground text-balance md:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
