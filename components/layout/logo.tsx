import { cn } from '@/lib/utils'

/**
 * Placeholder logo mark. The official Arbyter logo will replace the mark
 * inside `LogoMark` later — kept intentionally simple.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground',
        className,
      )}
      aria-hidden="true"
    >
      <span className="text-sm font-bold tracking-tight">A</span>
    </div>
  )
}

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      {!collapsed ? (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight text-foreground">
            Arbyter OS
          </span>
          <span className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Orchestrate · Govern · Secure
          </span>
        </div>
      ) : null}
    </div>
  )
}
