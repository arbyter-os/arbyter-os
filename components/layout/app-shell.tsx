'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <div className="relative flex min-h-screen bg-transparent">
      <div
        className={cn(
          'hidden shrink-0 transition-[width] duration-200 ease-out lg:block',
          collapsed ? 'w-[4.5rem]' : 'w-64',
        )}
      >
        <div
          className={cn(
            'fixed inset-y-3 left-3 transition-[width] duration-200 ease-out',
            collapsed ? 'w-[4.5rem]' : 'w-64',
          )}
        >
          <Sidebar collapsed={collapsed} />
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-3 left-3 w-72 max-w-[85%] overflow-hidden rounded-2xl glass-strong">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
