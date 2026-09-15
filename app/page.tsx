"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

const BLUE = "#1300BA"

type Pillar = {
  title: string
  eyebrow: string
  description: string
  details: string[]
}

const pillars: Pillar[] = [
  {
    title: "Governance",
    eyebrow: "ALIGN",
    description:
      "Define how autonomous agents are expected to behave across the enterprise.",
    details: [
      "Agent policies and operating principles",
      "Ethics, reviews and governance workflows",
      "Organization-wide AI rules",
    ],
  },
  {
    title: "Control",
    eyebrow: "DIRECT",
    description:
      "Set boundaries around what agents can access, change and execute.",
    details: [
      "Permissions and tool boundaries",
      "Access controls and kill switches",
      "Human approval for critical actions",
    ],
  },
  {
    title: "Visibility",
    eyebrow: "SEE",
    description:
      "Understand what every agent is doing, touching and deciding.",
    details: [
      "Live agent activity",
      "Tools, data and interactions",
      "Cross-agent operational visibility",
    ],
  },
  {
    title: "Audit",
    eyebrow: "PROVE",
    description:
      "Create a durable record of what happened and why.",
    details: [
      "Decision history",
      "Activity timelines",
      "Evidence for reviews and investigations",
    ],
  },
  {
    title: "Security",
    eyebrow: "DEFEND",
    description:
      "Protect the agent layer from misuse, compromise and unexpected behavior.",
    details: [
      "Threat detection",
      "Sandboxing and security controls",
      "Identity and credential oversight",
    ],
  },
  {
    title: "Compliance",
    eyebrow: "CONFORM",
    description:
      "Keep autonomous systems operating inside organizational and regulatory boundaries.",
    details: [
      "Policy enforcement",
      "Regulatory requirements",
      "Compliance monitoring and evidence",
    ],
  },
  {
    title: "Investigation",
    eyebrow: "UNDERSTAND",
    description:
      "Move from an alert to understanding exactly what went wrong.",
    details: [
      "Trace agent actions",
      "Investigate failures",
      "Connect events across systems",
    ],
  },
  {
    title: "Risk",
    eyebrow: "ANTICIPATE",
    description:
      "Identify behavior that could create financial, operational or strategic risk.",
    details: [
      "Risk profiles",
      "Unexpected behavior detection",
      "Business-impact analysis",
    ],
  },
]

const agents = [
  "Research",
  "Sales",
  "Finance",
  "Support",
  "Operations",
  "Data",
  "Security",
  "Custom",
  "Analytics",
  "Coding",
  "Marketing",
  "Procurement",
]

function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 456 406"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Arbyter"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="
          M 166.5 46
          A 51 51 0 0 1 254.8 46
          L 421.2 334.3
          A 49 49 0 0 1 336.3 383.3
          L 327.9 368.8
          A 24 24 0 0 0 307.1 357
          L 74.8 357
          A 51 51 0 0 1 30.6 280.5
          L 166.5 46 Z
          M 210.7 174.1
          L 259.7 259
          L 161.7 259
          Z
        "
        fill="#000000"
      />
      <circle cx="356" cy="49" r="49" fill={BLUE} />
    </svg>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3 text-[11px] font-bold tracking-[0.28em] text-[#1300BA]">
      <span className="h-px w-8 bg-[#1300BA]" />
      {children}
    </div>
  )
}

export default function Home() {
  const [phase, setPhase] = useState(0)
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhase((current) => {
        if (current >= 4) return current
        return current + 1
      })
    }, 2600)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const shuffledAgents = useMemo(
    () =>
      agents.map((name, index) => ({
        name,
        x: `${8 + ((index * 31) % 84)}%`,
        y: `${15 + ((index * 47) % 70)}%`,
        delay: `${(index % 8) * -0.55}s`,
        duration: `${5.2 + (index % 5) * 0.8}s`,
      })),
    []
  )

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f9fc] text-[#09090b] selection:bg-[#1300BA] selection:text-white">
      {/* NAV */}
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-black/10 bg-white/85 shadow-sm backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 md:px-8">
          <a href="#" className="flex items-center gap-3">
            <Logo className="h-8 w-9" />
            <span className="text-[17px] font-bold tracking-[-0.04em]">
              ARBYTER
            </span>
          </a>

          <div className="hidden items-center gap-8 text-[12px] font-semibold tracking-[0.12em] text-black/60 md:flex">
            <a href="#system" className="transition hover:text-black">
              SYSTEM
            </a>
            <a href="#capabilities" className="transition hover:text-black">
              CAPABILITIES
            </a>
            <a href="#contact" className="transition hover:text-black">
              CONTACT
            </a>
          </div>

          <Link
            href="/login"
            className="rounded-full bg-black px-5 py-2.5 text-[11px] font-bold tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-[#1300BA]"
          >
            DEMO
          </Link>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* LAYER 01 — MOVIE INTRO */}
      {/* ========================================================= */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden border-b border-black/10 bg-[#f8f9fc]">
        <div className="absolute inset-0 hero-grid opacity-60" />

        <div
          className={`absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1300BA]/[0.025] blur-3xl transition-all duration-[1800ms] ${
            phase >= 2 ? "scale-[1.7] bg-[#1300BA]/[0.08]" : ""
          }`}
        />

        {/* CHAOS FIELD */}
        <div
          className={`absolute inset-0 transition-all duration-[1600ms] ${
            phase >= 2
              ? "scale-[0.75] opacity-0"
              : phase === 1
                ? "scale-[1.08]"
                : "scale-100"
          }`}
        >
          {shuffledAgents.map((agent, index) => (
            <div
              key={agent.name}
              className={`movie-agent ${
                phase === 1 ? "movie-agent-chaos" : ""
              }`}
              style={{
                left: agent.x,
                top: agent.y,
                animationDelay: agent.delay,
                animationDuration: agent.duration,
              }}
            >
              <div className="movie-agent-body">
                <span className="movie-agent-core" />
                <span className="movie-agent-label">{agent.name}</span>
              </div>

              <div className="movie-agent-trail" />
            </div>
          ))}
        </div>

        {/* CHAOS MOTION */}
        <div
          className={`pointer-events-none absolute inset-0 transition-all duration-1000 ${
            phase >= 2 ? "opacity-0 scale-125" : "opacity-100"
          }`}
        >
          <div className="movie-motion motion-1" />
          <div className="movie-motion motion-2" />
          <div className="movie-motion motion-3" />
          <div className="movie-motion motion-4" />
          <div className="movie-motion motion-5" />
          <div className="movie-motion motion-6" />
        </div>

        {/* FLASH */}
        <div
          className={`pointer-events-none absolute inset-0 z-20 ${
            phase === 2 ? "movie-flash-active" : "opacity-0"
          }`}
        >
          <div className="movie-white-flash" />

          <div className="central-strike">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        {/* CAPTURE FIELD */}
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-all duration-[1400ms] ${
            phase >= 2
              ? "scale-100 opacity-100"
              : "scale-[0.01] opacity-0"
          }`}
        >
          <div className="capture-orbit orbit-a" />
          <div className="capture-orbit orbit-b" />
          <div className="capture-orbit orbit-c" />
          <div className="capture-orbit orbit-d" />

          <div className="capture-core">
            <div className="capture-core-inner">
              <div className="capture-energy" />
            </div>
          </div>
        </div>

        {/* CAPTURED PARTICLES */}
        <div
          className={`pointer-events-none absolute inset-0 z-25 ${
            phase >= 2 ? "captured-particles-active" : ""
          }`}
        >
          {Array.from({ length: 18 }).map((_, index) => (
            <span
              key={index}
              className={`captured-particle particle-${index + 1}`}
            />
          ))}
        </div>

        {/* LOGO ASSEMBLY */}
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 transition-all duration-[1600ms] ${
            phase >= 3
              ? "logo-arrival"
              : "scale-[0.15] rotate-[-18deg] opacity-0"
          }`}
        >
          <div className="logo-energy-ring ring-main" />
          <div className="logo-energy-ring ring-secondary" />

          <div className="movie-logo">
            <Logo className="h-[130px] w-[146px] md:h-[190px] md:w-[214px]" />
          </div>
        </div>

        {/* CLEAN LOGO HOLD */}
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 transition-all duration-[1200ms] ${
            phase >= 4
              ? "scale-100 opacity-100"
              : "scale-90 opacity-0"
          }`}
        >
          <div className="logo-hold-glow" />
          <Logo className="relative h-[120px] w-[136px] md:h-[175px] md:w-[198px]" />
        </div>
      </section>

      {/* ========================================================= */}
      {/* LAYER 02 — THE REASSEMBLY */}
      {/* ========================================================= */}
      <section className="relative flex min-h-[850px] items-center justify-center overflow-hidden bg-white">
        <div className="absolute inset-0 blueprint-grid" />

        <div className="relative z-10 w-full max-w-[1250px] px-5 md:px-8">
          <div
            className={`text-center transition-all duration-1000 ${
              phase >= 3 ? "opacity-100" : "opacity-0"
            }`}
          >
            <SectionLabel>ARBYTER OS</SectionLabel>

            <h2 className="mx-auto max-w-4xl text-[clamp(42px,7vw,92px)] font-bold leading-[0.88] tracking-[-0.07em]">
              From scattered agents
              <br />
              to one governed system.
            </h2>

            <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-black/50 md:text-base">
              Arbyter doesn't replace your agents.
              <br />
              It becomes the layer that governs them.
            </p>
          </div>

          {/* ASSEMBLING FORTRESS */}
          <div
            className={`relative mx-auto mt-14 h-[500px] max-w-[1050px] transition-all duration-[1600ms] ${
              phase >= 3
                ? "scale-100 opacity-100"
                : "scale-[0.35] opacity-0"
            }`}
          >
            <div className="fortress-piece piece-1">CONTROL</div>
            <div className="fortress-piece piece-2">AUDIT</div>
            <div className="fortress-piece piece-3">SECURITY</div>
            <div className="fortress-piece piece-4">RISK</div>
            <div className="fortress-piece piece-5">VISIBILITY</div>
            <div className="fortress-piece piece-6">GOVERNANCE</div>

            <div className="absolute left-1/2 top-1/2 w-full max-w-[950px] -translate-x-1/2 -translate-y-1/2">
              {/* ROOF */}
              <div className="fortress-roof relative mx-auto flex h-[120px] max-w-[720px] items-center justify-center">
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/20" />
                <div className="absolute inset-x-[8%] top-[25%] h-[1px] bg-[#1300BA]/25" />

                <div className="relative z-10 flex items-center gap-5 rounded-2xl border border-black/10 bg-white px-8 py-5 shadow-xl">
                  <Logo className="h-12 w-14" />

                  <div>
                    <div className="text-[10px] font-bold tracking-[0.3em] text-[#1300BA]">
                      ARBYTER OS
                    </div>

                    <div className="mt-1 text-xl font-bold tracking-[-0.04em]">
                      ORCHESTRATE · GOVERN · SECURE
                    </div>
                  </div>
                </div>
              </div>

              {/* PILLARS */}
              <div
                id="capabilities"
                className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3"
              >
                {pillars.map((pillar, index) => (
                  <button
                    key={pillar.title}
                    onClick={() => setSelectedPillar(pillar)}
                    className="group fortress-pillar relative flex min-h-[190px] flex-col justify-between overflow-hidden border border-black/10 bg-white p-5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-2 hover:border-[#1300BA]/40 hover:shadow-[0_25px_60px_rgba(19,0,186,0.12)] md:min-h-[230px]"
                    style={{
                      transitionDelay: `${index * 45}ms`,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold tracking-[0.25em] text-[#1300BA]">
                          {pillar.eyebrow}
                        </span>

                        <span className="text-black/20 transition group-hover:text-[#1300BA]">
                          ↗
                        </span>
                      </div>

                      <h3 className="mt-5 text-lg font-bold tracking-[-0.04em] md:text-xl">
                        {pillar.title}
                      </h3>

                      <p className="mt-3 text-xs leading-5 text-black/45">
                        {pillar.description}
                      </p>
                    </div>

                    <div className="mt-5 h-px w-full bg-black/10 transition group-hover:bg-[#1300BA]/30" />
                  </button>
                ))}
              </div>

              {/* FOUNDATION = AGENTS */}
              <div className="relative mt-3 overflow-hidden border border-black/10 bg-[#111114] px-5 py-6 shadow-2xl md:px-8">
                <div className="absolute inset-0 opacity-20">
                  <div className="foundation-grid" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] font-bold tracking-[0.3em] text-[#8d88ff]">
                        THE FOUNDATION
                      </div>

                      <div className="mt-1 text-lg font-bold tracking-[-0.03em] text-white">
                        YOUR AI AGENTS
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[9px] font-bold tracking-[0.2em] text-white/35">
                        CONNECT
                      </div>

                      <div className="mt-1 text-xs text-white/60">
                        ANY AGENT · ANY STACK
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 md:grid-cols-6">
                    {agents.slice(0, 12).map((agent) => (
                      <div
                        key={agent}
                        className="border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-[9px] font-semibold tracking-[0.12em] text-white/50"
                      >
                        {agent}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* LAYER 03 — WHAT ARBYTER ACTUALLY DOES */}
      {/* ========================================================= */}
      <section
        id="system"
        className="relative overflow-hidden border-y border-black/10 bg-[#f1f3f8] py-32"
      >
        <div className="mx-auto max-w-[1250px] px-5 md:px-8">
          <div className="grid gap-16 md:grid-cols-[0.8fr_1.2fr] md:items-start">
            <div>
              <SectionLabel>THE LAYER</SectionLabel>

              <h2 className="text-[clamp(42px,6vw,76px)] font-bold leading-[0.9] tracking-[-0.07em]">
                Intelligence
                <br />
                needs
                <br />
                governance.
              </h2>

              <p className="mt-8 max-w-md text-sm leading-7 text-black/50">
                As enterprises deploy more autonomous agents, the problem is
                no longer simply making agents intelligent.
              </p>

              <p className="mt-5 max-w-md text-sm font-semibold leading-7 text-black/80">
                The problem is knowing what they are doing — and being able to
                control it.
              </p>
            </div>

            <div className="space-y-3">
              {[
                ["01", "CONNECT", "Bring your existing AI agents into one layer."],
                ["02", "OBSERVE", "See activity, tools, data, decisions and interactions."],
                ["03", "GOVERN", "Apply policies, permissions, boundaries and controls."],
                ["04", "INVESTIGATE", "Trace failures, threats and unexpected behavior."],
                ["05", "ACT", "Know what requires attention and what to do next."],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="group grid grid-cols-[55px_130px_1fr] items-center gap-4 border border-black/10 bg-white p-5 transition hover:border-[#1300BA]/30 hover:shadow-xl md:p-6"
                >
                  <span className="text-xs font-bold text-[#1300BA]">
                    {number}
                  </span>

                  <span className="text-[11px] font-bold tracking-[0.18em]">
                    {title}
                  </span>

                  <span className="text-xs leading-5 text-black/45">
                    {description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* LAYER 04 — MAP */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden bg-white py-32">
        <div className="mx-auto max-w-[1250px] px-5 md:px-8">
          <SectionLabel>ONE LAYER ABOVE EVERY AGENT</SectionLabel>

          <div className="relative mt-12 overflow-hidden border border-black/10 bg-[#fafbfe] p-5 md:p-10">
            <div className="absolute inset-0 blueprint-grid opacity-50" />

            <div className="relative z-10 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
              {/* ENTERPRISE */}
              <div className="border border-black/10 bg-white p-7 shadow-sm">
                <div className="text-[9px] font-bold tracking-[0.25em] text-black/35">
                  ENTERPRISE
                </div>

                <div className="mt-5 text-2xl font-bold tracking-[-0.05em]">
                  People
                  <br />
                  + Systems
                  <br />
                  + Data
                </div>
              </div>

              <div className="hidden text-2xl text-[#1300BA] md:block">
                →
              </div>

              {/* ARBYTER */}
              <div className="relative border-2 border-[#1300BA]/30 bg-white p-8 shadow-[0_25px_70px_rgba(19,0,186,0.12)]">
                <div className="absolute right-5 top-5 h-2 w-2 rounded-full bg-[#1300BA]" />

                <Logo className="h-16 w-18" />

                <div className="mt-6 text-[9px] font-bold tracking-[0.3em] text-[#1300BA]">
                  GOVERNANCE LAYER
                </div>

                <div className="mt-2 text-2xl font-bold tracking-[-0.05em]">
                  ARBYTER OS
                </div>
              </div>

              <div className="hidden text-2xl text-[#1300BA] md:block">
                →
              </div>

              {/* AGENTS */}
              <div className="border border-black/10 bg-white p-7 shadow-sm">
                <div className="text-[9px] font-bold tracking-[0.25em] text-black/35">
                  AGENTIC LAYER
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {agents.slice(0, 8).map((agent) => (
                    <div
                      key={agent}
                      className="border border-black/10 px-3 py-3 text-center text-[9px] font-semibold"
                    >
                      {agent}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* LAYER 05 — CTA */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden bg-[#f1f3f8] py-32">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1300BA]/[0.05] blur-3xl" />

        <div className="relative z-10 mx-auto max-w-[950px] px-5 text-center">
          <Logo className="mx-auto h-20 w-24" />

          <div className="mt-10 text-[11px] font-bold tracking-[0.35em] text-[#1300BA]">
            ARBYTER OS
          </div>

          <h2 className="mt-6 text-[clamp(48px,8vw,100px)] font-bold leading-[0.85] tracking-[-0.075em]">
            Autonomous
            <br />
            intelligence.
            <br />
            Governed.
          </h2>

          <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-black/50">
            Connect your agents. Understand what they do. Control how they
            operate. Secure the systems that run your business.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#1300BA] px-8 text-[11px] font-bold tracking-[0.2em] text-white shadow-[0_15px_40px_rgba(19,0,186,0.25)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(19,0,186,0.35)]"
            >
              ENTER ARBYTER
            </Link>

            <a
              href="mailto:arbyteros@gmail.com"
              className="inline-flex h-12 items-center justify-center rounded-full border border-black/15 bg-white px-8 text-[11px] font-bold tracking-[0.2em] transition hover:border-black/30 hover:bg-black hover:text-white"
            >
              CONTACT US
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        id="contact"
        className="border-t border-black/10 bg-white px-5 py-8 md:px-8"
      >
        <div className="mx-auto flex max-w-[1400px] flex-col gap-5 text-xs text-black/40 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-6 w-7" />

            <span className="font-bold tracking-[-0.03em] text-black">
              ARBYTER OS
            </span>
          </div>

          <div>ORCHESTRATE · GOVERN · SECURE</div>

          <a
            href="mailto:arbyteros@gmail.com"
            className="font-semibold transition hover:text-[#1300BA]"
          >
            arbyteros@gmail.com
          </a>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* PILLAR MODAL */}
      {/* ========================================================= */}
      {selectedPillar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-5 backdrop-blur-md"
          onClick={() => setSelectedPillar(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-xl overflow-auto border border-black/10 bg-white p-7 shadow-[0_40px_120px_rgba(0,0,0,0.25)] md:p-10"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPillar(null)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/50 transition hover:bg-black hover:text-white"
              aria-label="Close"
            >
              ×
            </button>

            <div className="text-[10px] font-bold tracking-[0.3em] text-[#1300BA]">
              {selectedPillar.eyebrow}
            </div>

            <h3 className="mt-4 text-4xl font-bold tracking-[-0.06em]">
              {selectedPillar.title}
            </h3>

            <p className="mt-5 text-sm leading-7 text-black/55">
              {selectedPillar.description}
            </p>

            <div className="mt-8 space-y-2">
              {selectedPillar.details.map((detail, index) => (
                <div
                  key={detail}
                  className="flex items-center gap-4 border border-black/10 bg-[#f8f9fc] p-4"
                >
                  <span className="text-[10px] font-bold text-[#1300BA]">
                    0{index + 1}
                  </span>

                  <span className="text-sm font-medium">
                    {detail}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedPillar(null)}
              className="mt-8 w-full rounded-full bg-black py-3 text-[10px] font-bold tracking-[0.2em] text-white transition hover:bg-[#1300BA]"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #f8f9fc;
        }

        .hero-grid {
          background-image:
            linear-gradient(rgba(0, 0, 0, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.035) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: radial-gradient(
            circle at center,
            black 15%,
            transparent 85%
          );
        }

        .blueprint-grid {
          background-image:
            linear-gradient(rgba(19, 0, 186, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(19, 0, 186, 0.045) 1px, transparent 1px);
          background-size: 36px 36px;
        }

        .foundation-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.12) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.12) 1px,
              transparent 1px
            );
          background-size: 32px 32px;
        }

        /* ========================================================= */
        /* MOVIE INTRO */
        /* ========================================================= */

        .movie-agent {
          position: absolute;
          z-index: 5;
          transform-origin: center;
          animation: movieAgentMove linear infinite;
        }

        .movie-agent-chaos {
          animation-name: movieAgentChaos;
          animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
        }

        .movie-agent-body {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 11px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.86);
          box-shadow:
            0 8px 30px rgba(0, 0, 0, 0.06),
            0 0 25px rgba(19, 0, 186, 0.035);
          backdrop-filter: blur(12px);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.46);
          white-space: nowrap;
        }

        .movie-agent-core {
          display: block;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #1300ba;
          box-shadow:
            0 0 8px rgba(19, 0, 186, 0.8),
            0 0 18px rgba(19, 0, 186, 0.35);
        }

        .movie-agent-trail {
          position: absolute;
          left: -80%;
          top: 50%;
          width: 180%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(19, 0, 186, 0.18),
            transparent
          );
          transform: translateY(-50%);
          z-index: -1;
        }

        @keyframes movieAgentMove {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }

          25% {
            transform: translate3d(55px, -35px, 0) rotate(5deg);
          }

          50% {
            transform: translate3d(-45px, 55px, 0) rotate(-6deg);
          }

          75% {
            transform: translate3d(65px, 20px, 0) rotate(4deg);
          }

          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
        }

        @keyframes movieAgentChaos {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          }

          20% {
            transform: translate3d(
                calc(50px + 2vw),
                calc(-45px - 2vh),
                0
              )
              rotate(13deg)
              scale(1.03);
          }

          40% {
            transform: translate3d(
                calc(-65px - 2vw),
                calc(65px + 2vh),
                0
              )
              rotate(-16deg)
              scale(0.96);
          }

          60% {
            transform: translate3d(
                calc(75px + 3vw),
                calc(20px + 2vh),
                0
              )
              rotate(10deg)
              scale(1.05);
          }

          80% {
            transform: translate3d(
                calc(-45px - 2vw),
                calc(-55px - 2vh),
                0
              )
              rotate(-12deg)
              scale(0.98);
          }

          100% {
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          }
        }

        .movie-motion {
          position: absolute;
          height: 1px;
          transform-origin: center;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(19, 0, 186, 0.2),
            transparent
          );
          animation: motionSweep 2.7s ease-in-out infinite;
        }

        .motion-1 {
          left: -5%;
          top: 22%;
          width: 42%;
          transform: rotate(17deg);
        }

        .motion-2 {
          right: -3%;
          top: 29%;
          width: 40%;
          transform: rotate(-21deg);
          animation-delay: -0.8s;
        }

        .motion-3 {
          left: 4%;
          top: 57%;
          width: 38%;
          transform: rotate(-13deg);
          animation-delay: -1.4s;
        }

        .motion-4 {
          right: 0;
          top: 64%;
          width: 43%;
          transform: rotate(14deg);
          animation-delay: -2s;
        }

        .motion-5 {
          left: 25%;
          top: 14%;
          width: 24%;
          transform: rotate(-7deg);
          animation-delay: -0.4s;
        }

        .motion-6 {
          right: 22%;
          bottom: 17%;
          width: 26%;
          transform: rotate(8deg);
          animation-delay: -1.8s;
        }

        @keyframes motionSweep {
          0%,
          100% {
            opacity: 0.12;
            transform: scaleX(0.65) rotate(15deg);
          }

          50% {
            opacity: 0.65;
            transform: scaleX(1.15) rotate(-12deg);
          }
        }

        /* FLASH */

        .movie-flash-active {
          animation: flashContainer 0.8s ease-out forwards;
        }

        .movie-white-flash {
          position: absolute;
          inset: 0;
          background: white;
          opacity: 0;
          animation: whiteFlash 0.8s ease-out forwards;
        }

        @keyframes flashContainer {
          0% {
            opacity: 1;
          }

          100% {
            opacity: 1;
          }
        }

        @keyframes whiteFlash {
          0% {
            opacity: 0;
          }

          12% {
            opacity: 0.95;
          }

          24% {
            opacity: 0.15;
          }

          38% {
            opacity: 0.9;
          }

          58% {
            opacity: 0.05;
          }

          100% {
            opacity: 0;
          }
        }

        .central-strike {
          position: absolute;
          left: 50%;
          top: -15%;
          width: 180px;
          height: 130%;
          transform: translateX(-50%);
          filter: drop-shadow(0 0 12px rgba(19, 0, 186, 0.9));
        }

        .central-strike span {
          position: absolute;
          left: 50%;
          top: 0;
          width: 3px;
          height: 100%;
          background: #1300ba;
          transform-origin: center;
          animation: lightningStrike 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)
            forwards;
        }

        .central-strike span:nth-child(1) {
          transform: translateX(-50%) rotate(2deg);
        }

        .central-strike span:nth-child(2) {
          transform: translateX(-50%) rotate(9deg);
          width: 2px;
        }

        .central-strike span:nth-child(3) {
          transform: translateX(-50%) rotate(-7deg);
          width: 4px;
        }

        .central-strike span:nth-child(4) {
          transform: translateX(-50%) rotate(17deg);
          width: 1px;
        }

        .central-strike span:nth-child(5) {
          transform: translateX(-50%) rotate(-16deg);
          width: 1px;
        }

        @keyframes lightningStrike {
          0% {
            opacity: 0;
            clip-path: inset(0 0 100% 0);
          }

          25% {
            opacity: 1;
          }

          100% {
            opacity: 0.85;
            clip-path: inset(0 0 0 0);
          }
        }

        /* CAPTURE */

        .capture-orbit {
          position: absolute;
          left: 50%;
          top: 50%;
          border: 1px solid rgba(19, 0, 186, 0.25);
          border-radius: 999px;
          transform: translate(-50%, -50%);
          animation: captureOrbit 2.2s ease-out infinite;
        }

        .orbit-a {
          width: 180px;
          height: 180px;
        }

        .orbit-b {
          width: 290px;
          height: 290px;
          animation-delay: 0.15s;
        }

        .orbit-c {
          width: 430px;
          height: 430px;
          animation-delay: 0.3s;
        }

        .orbit-d {
          width: 590px;
          height: 590px;
          animation-delay: 0.45s;
        }

        @keyframes captureOrbit {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.55);
          }

          20% {
            opacity: 0.9;
          }

          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.12);
          }
        }

        .capture-core {
          position: relative;
          display: flex;
          height: 170px;
          width: 170px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(19, 0, 186, 0.3);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          box-shadow:
            0 0 60px rgba(19, 0, 186, 0.15),
            0 0 140px rgba(19, 0, 186, 0.08);
          backdrop-filter: blur(20px);
        }

        .capture-core-inner {
          position: relative;
          height: 65px;
          width: 65px;
          border-radius: 999px;
          background: #1300ba;
          box-shadow:
            0 0 25px rgba(19, 0, 186, 0.8),
            0 0 70px rgba(19, 0, 186, 0.4);
          animation: corePulse 1.2s ease-in-out infinite;
        }

        .capture-energy {
          position: absolute;
          inset: 10px;
          border-radius: 999px;
          background: white;
          box-shadow: 0 0 20px white;
        }

        @keyframes corePulse {
          0%,
          100% {
            transform: scale(0.85);
          }

          50% {
            transform: scale(1.1);
          }
        }

        /* PARTICLES */

        .captured-particle {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #1300ba;
          opacity: 0;
          box-shadow: 0 0 12px rgba(19, 0, 186, 0.75);
        }

        .captured-particles-active .captured-particle {
          animation: particleCapture 1.4s cubic-bezier(0.2, 0.85, 0.25, 1)
            forwards;
        }

        .particle-1 {
          --start-x: -42vw;
          --start-y: -25vh;
        }

        .particle-2 {
          --start-x: 38vw;
          --start-y: -30vh;
        }

        .particle-3 {
          --start-x: -35vw;
          --start-y: 25vh;
        }

        .particle-4 {
          --start-x: 42vw;
          --start-y: 30vh;
        }

        .particle-5 {
          --start-x: -25vw;
          --start-y: -35vh;
        }

        .particle-6 {
          --start-x: 25vw;
          --start-y: 35vh;
        }

        .particle-7 {
          --start-x: -45vw;
          --start-y: 5vh;
        }

        .particle-8 {
          --start-x: 45vw;
          --start-y: -5vh;
        }

        .particle-9 {
          --start-x: -15vw;
          --start-y: 40vh;
        }

        .particle-10 {
          --start-x: 15vw;
          --start-y: -40vh;
        }

        .particle-11 {
          --start-x: -40vw;
          --start-y: -5vh;
        }

        .particle-12 {
          --start-x: 40vw;
          --start-y: 5vh;
        }

        .particle-13 {
          --start-x: -20vw;
          --start-y: -28vh;
        }

        .particle-14 {
          --start-x: 20vw;
          --start-y: 28vh;
        }

        .particle-15 {
          --start-x: -32vw;
          --start-y: 12vh;
        }

        .particle-16 {
          --start-x: 32vw;
          --start-y: -12vh;
        }

        .particle-17 {
          --start-x: -8vw;
          --start-y: 32vh;
        }

        .particle-18 {
          --start-x: 8vw;
          --start-y: -32vh;
        }

        @keyframes particleCapture {
          0% {
            opacity: 0;
            transform: translate(var(--start-x), var(--start-y)) scale(1.4);
          }

          15% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translate(0, 0) scale(0.1);
          }
        }

        /* LOGO */

        .logo-energy-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          border: 1px solid rgba(19, 0, 186, 0.22);
          border-radius: 999px;
          transform: translate(-50%, -50%);
          animation: logoRing 2.2s ease-out infinite;
        }

        .ring-main {
          width: 260px;
          height: 260px;
        }

        .ring-secondary {
          width: 380px;
          height: 380px;
          animation-delay: 0.25s;
        }

        @keyframes logoRing {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.7) rotate(0deg);
          }

          25% {
            opacity: 0.8;
          }

          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.12) rotate(90deg);
          }
        }

        .movie-logo {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: logoMaterialize 1.6s cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        @keyframes logoMaterialize {
          0% {
            opacity: 0;
            filter: blur(18px);
            transform: scale(0.25) rotate(-15deg);
          }

          45% {
            opacity: 1;
            filter: blur(3px);
          }

          75% {
            filter: blur(0);
          }

          100% {
            opacity: 1;
            filter: blur(0);
            transform: scale(1) rotate(0deg);
          }
        }

        .logo-arrival {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1) rotate(0deg);
        }

        .logo-hold-glow {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 230px;
          height: 230px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: rgba(19, 0, 186, 0.05);
          filter: blur(35px);
          animation: holdGlow 2.5s ease-in-out infinite;
        }

        @keyframes holdGlow {
          0%,
          100% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(0.9);
          }

          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.15);
          }
        }

        /* ========================================================= */
        /* FORTRESS */
        /* ========================================================= */

        .fortress-roof {
          clip-path: polygon(
            8% 0,
            92% 0,
            100% 35%,
            96% 35%,
            96% 100%,
            4% 100%,
            4% 35%,
            0 35%
          );
        }

        .fortress-pillar {
          position: relative;
        }

        .fortress-pillar::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 3px;
          height: 0;
          background: #1300ba;
          transition: height 0.5s ease;
        }

        .fortress-pillar:hover::before {
          height: 100%;
        }

        .fortress-piece {
          position: absolute;
          z-index: 1;
          padding: 8px 12px;
          border: 1px solid rgba(19, 0, 186, 0.18);
          background: rgba(255, 255, 255, 0.9);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: rgba(19, 0, 186, 0.7);
          animation: pieceAssemble 1.8s
            cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        .piece-1 {
          left: 5%;
          top: 10%;
          --tx: 320px;
          --ty: 200px;
        }

        .piece-2 {
          right: 4%;
          top: 14%;
          --tx: -320px;
          --ty: 190px;
        }

        .piece-3 {
          left: 0;
          top: 52%;
          --tx: 370px;
          --ty: 0px;
        }

        .piece-4 {
          right: 0;
          top: 55%;
          --tx: -370px;
          --ty: 0px;
        }

        .piece-5 {
          left: 14%;
          bottom: 4%;
          --tx: 250px;
          --ty: -160px;
        }

        .piece-6 {
          right: 13%;
          bottom: 4%;
          --tx: -250px;
          --ty: -160px;
        }

        @keyframes pieceAssemble {
          from {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) rotate(25deg);
          }

          60% {
            opacity: 1;
          }

          to {
            opacity: 0.25;
            transform: translate(0, 0) rotate(0);
          }
        }

        @media (max-width: 768px) {
          .fortress-piece {
            display: none;
          }

          .orbit-d {
            width: 340px;
            height: 340px;
          }

          .ring-secondary {
            width: 300px;
            height: 300px;
          }

          .capture-core {
            height: 135px;
            width: 135px;
          }

          .movie-agent-body {
            padding: 6px 8px;
            font-size: 7px;
          }

          .movie-agent-trail {
            left: -55%;
            width: 150%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .movie-agent,
          .movie-motion,
          .capture-orbit,
          .captured-particle,
          .movie-logo,
          .logo-energy-ring,
          .logo-hold-glow,
          .central-strike span {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  )
}