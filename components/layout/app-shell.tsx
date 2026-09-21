'use client'

import * as React from 'react'
import Link from 'next/link'
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
        <div className="relative flex items-center rounded-full border border-black/[0.08] bg-[#f5f5f7]/[0.88] p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#f5f5f7]/[0.72]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1.5 top-1.5 h-11 w-11 rounded-full bg-[#1300BA] shadow-[0_2px_8px_rgba(19,0,186,0.18)] transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[104px]"
            style={{
              transform: `translateX(${items.findIndex(({ href }) => pathname === href || pathname.startsWith(`${href}/`)) * 46}px)`,
            }}
          />

          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={cn(
                  'relative z-10 flex h-11 w-11 items-center justify-center rounded-full text-[12px] font-normal tracking-[-0.01em] transition-[transform,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.92] sm:w-[104px] sm:gap-2',
                  active ? 'text-white' : 'text-black/48 hover:text-black/75',
                )}
              >
                <Icon size={18} strokeWidth={1.8} className="shrink-0" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
