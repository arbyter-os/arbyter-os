'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, MessageSquare, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const BLUE = '#1300BA'

const items = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/discovery', label: 'Discovery', icon: Search },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <main className="min-h-screen px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
        <div className="mx-auto w-full max-w-[1400px]">{children}</div>
      </main>

      <nav
        aria-label="Primary navigation"
        className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
      >
        <div className="flex items-center gap-0.5 rounded-full border border-black/[0.08] bg-[#f5f5f7]/[0.88] p-1.5 backdrop-blur-2xl">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <a
                key={href}
                href={href}
                aria-label={label}
                className={cn(
                  'flex h-11 items-center gap-2 rounded-full px-3 text-[12px] font-normal tracking-[-0.01em] transition-transform active:scale-[0.95]',
                  active ? 'text-white' : 'text-black/48 hover:bg-black/[0.05] hover:text-black/75',
                )}
                style={active ? { background: BLUE } : undefined}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span className="hidden sm:block">{label}</span>
              </a>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
