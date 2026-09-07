import * as React from 'react'
import { ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'

export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<'select'>) {
  return (
    <div className="relative inline-flex w-full items-center">
      <select
        data-slot="select"
        className={cn(
          'h-9 w-full appearance-none rounded-lg border border-border bg-background pl-3 pr-8 text-base text-foreground shadow-sm outline-none transition-colors md:text-sm',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
          'disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronsUpDown
        className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}
