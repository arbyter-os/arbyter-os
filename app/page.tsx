'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Intro } from '@/components/landing/intro'

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <Intro />

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/arbyter-logo.svg"
            alt="Arbyter OS"
            width={34}
            height={34}
            className="h-8 w-8 object-contain"
          />

          <div>
            <div className="text-sm font-bold tracking-tight">
              Arbyter OS
            </div>

            <div className="text-[9px] font-medium uppercase tracking-[0.16em] text-neutral-400">
              AI Orchestration
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-8 text-sm text-neutral-500 md:flex">
          <a
            href="#platform"
            className="transition hover:text-neutral-950"
          >
            Platform
          </a>

          <a
            href="#governance"
            className="transition hover:text-neutral-950"
          >
            Governance
          </a>

          <a
            href="#security"
            className="transition hover:text-neutral-950"
          >
            Security
          </a>
        </div>

        <Link
          href="/overview"
          className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Open Platform
        </Link>
      </nav>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-24 lg:px-8 lg:pb-32 lg:pt-32">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            AI Governance Infrastructure
          </div>

          <h1 className="text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
            AI governance,
            <br />
            orchestrated.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-500 sm:text-xl">
            Arbyter OS gives organizations one control layer for managing AI
            agents, policies, controls, risks, investigations, and evidence.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/overview"
              className="rounded-full bg-neutral-950 px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Enter Arbyter
            </Link>

            <a
              href="#platform"
              className="rounded-full border border-neutral-200 px-6 py-3 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Explore platform
            </a>
          </div>
        </div>

        <div className="mt-24 rounded-3xl border border-neutral-200 bg-neutral-50 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.06)] sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Governance Architecture
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              One control layer for your AI environment.
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            {[
              ['01', 'AI Agents'],
              ['02', 'Tasks'],
              ['03', 'Policies'],
              ['04', 'Controls'],
              ['05', 'Evidence'],
            ].map(([number, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-neutral-200 bg-white p-5"
              >
                <div className="text-[10px] font-semibold tracking-[0.15em] text-neutral-400">
                  {number}
                </div>

                <div className="mt-8 text-sm font-semibold">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="platform"
        className="border-t border-neutral-200 px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            The Platform
          </p>

          <div className="mt-5 grid gap-12 lg:grid-cols-2">
            <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              From autonomous agents to accountable systems.
            </h2>

            <p className="max-w-xl text-lg leading-8 text-neutral-500">
              Arbyter connects the operational layer of AI with the governance
              layer. Every important decision can be governed, monitored,
              investigated, and evidenced.
            </p>
          </div>
        </div>
      </section>

      <section
        id="governance"
        className="border-t border-neutral-200 bg-neutral-50 px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Govern',
                text: 'Define policies and controls that shape how AI agents operate.',
              },
              {
                title: 'Investigate',
                text: 'Trace incidents, policy violations, and risk events across your AI environment.',
              },
              {
                title: 'Prove',
                text: 'Build an evidence trail for audits, compliance, and executive oversight.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-neutral-200 bg-white p-8"
              >
                <h3 className="text-xl font-semibold">
                  {item.title}
                </h3>

                <p className="mt-4 leading-7 text-neutral-500">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="security"
        className="border-t border-neutral-200 px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Built for accountability
          </p>

          <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Make AI systems easier to understand, control, and audit.
          </h2>

          <Link
            href="/overview"
            className="mt-10 inline-flex rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Open Arbyter Platform
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-200 px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-xs text-neutral-400 sm:flex-row">
          <span>© 2026 Arbyter OS</span>

          <span>Orchestrate · Govern · Secure</span>
        </div>
      </footer>
    </main>
  )
}