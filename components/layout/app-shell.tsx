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
  const navRef = React.useRef<HTMLElement>(null)
  const indicatorRef = React.useRef<HTMLDivElement>(null)

  const activeIndex = Math.max(
    0,
    items.findIndex(({ href }) => pathname === href || pathname.startsWith(`${href}/`)),
  )

  React.useLayoutEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!nav || !indicator) return

    const buttons = Array.from(
      nav.querySelectorAll<HTMLElement>('[data-nav-item]'),
    )

    const updateIndicator = (animate: boolean) => {
      const target = buttons[activeIndex]
      if (!target) return

      const navRect = nav.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()

      indicator.style.transition = animate
        ? 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), width 0.45s cubic-bezier(0.25, 1, 0.5, 1)'
        : 'none'

      indicator.style.width = `${targetRect.width}px`
      indicator.style.transform = `translate3d(${targetRect.left - navRect.left}px, 0, 0)`
    }

    updateIndicator(false)

    const frame = requestAnimationFrame(() => updateIndicator(true))
    const resizeObserver = new ResizeObserver(() => updateIndicator(false))
    resizeObserver.observe(nav)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
    }
  }, [activeIndex])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(19,0,186,.07),transparent_28%),radial-gradient(circle_at_88%_100%,rgba(19,0,186,.045),transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(19,0,186,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(19,0,186,.055)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
      </div>

      <main className="relative z-10 min-h-screen px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
        <div className="mx-auto w-full max-w-[1400px]">{children}</div>
      </main>

      <nav
        ref={navRef}
        aria-label="Primary navigation"
        className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
      >
        <div className="relative flex items-center rounded-full border border-black/[0.08] bg-[#f5f5f7]/[0.88] p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#f5f5f7]/[0.72]">
          <div
            ref={indicatorRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-1.5 h-11 rounded-full bg-[#1300BA] shadow-[0_2px_8px_rgba(19,0,186,0.18)] will-change-transform"
          />

          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)

            return (
              <Link
                key={href}
                href={href}
                data-nav-item
                aria-label={label}
                className={cn(
                  'relative z-10 flex h-11 w-11 items-center justify-center rounded-full text-[12px] font-normal tracking-[-0.01em] transition-[transform,color] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] active:scale-[0.96] sm:w-auto sm:min-w-[104px] sm:gap-2 sm:px-3',
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
