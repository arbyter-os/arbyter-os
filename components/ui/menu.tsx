'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

type Align = 'start' | 'end'

interface MenuContextValue {
  open: boolean
  setOpen: (v: boolean) => void
}

const MenuContext = React.createContext<MenuContextValue | null>(null)

export function Menu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <MenuContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative">
        {children}
      </div>
    </MenuContext.Provider>
  )
}

export function MenuTrigger({
  children,
  className,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode
  className?: string
  'aria-label'?: string
}) {
  const ctx = React.useContext(MenuContext)!
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={ctx.open}
      aria-label={ariaLabel}
      onClick={() => ctx.setOpen(!ctx.open)}
      className={className}
    >
      {children}
    </button>
  )
}

export function MenuContent({
  children,
  align = 'end',
  className,
}: {
  children: React.ReactNode
  align?: Align
  className?: string
}) {
  const ctx = React.useContext(MenuContext)!
  if (!ctx.open) return null
  return (
    <div
      role="menu"
      className={cn(
        'absolute z-50 mt-2 min-w-56 origin-top rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg shadow-black/5',
        'data-[align=end]:right-0 data-[align=start]:left-0',
        className,
      )}
      data-align={align}
    >
      {children}
    </div>
  )
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
      {children}
    </div>
  )
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-border" role="separator" />
}

export function MenuItem({
  children,
  onSelect,
  className,
}: {
  children: React.ReactNode
  onSelect?: () => void
  className?: string
}) {
  const ctx = React.useContext(MenuContext)!
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onSelect?.()
        ctx.setOpen(false)
      }}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none [&_svg]:size-4 [&_svg]:text-muted-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}
