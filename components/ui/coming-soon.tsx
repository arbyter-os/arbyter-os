import { Construction } from 'lucide-react'

export function ComingSoon({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
        <Construction className="size-6" aria-hidden="true" />
      </div>
      <span className="mt-6 inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        Coming soon
      </span>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground text-balance">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
        {description ??
          `The ${title} workspace is being built. This section will arrive in an upcoming release of Arbyter OS.`}
      </p>
    </div>
  )
}
