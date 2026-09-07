import Image from 'next/image'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center',
        className,
      )}
      aria-hidden="true"
    >
      <Image
        src="/arbyter-logo.svg"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 object-contain"
        priority
      />
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