"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  const [introDone, setIntroDone] = useState(false)
  const [introPhase, setIntroPhase] = useState(0)
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)

  /*
   * ------------------------------------------------------------
   * CINEMATIC SOUND ENGINE
   * ------------------------------------------------------------
   */

  const startAudio = () => {
    if (typeof window === "undefined") return

    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext
      }).webkitAudioContext

    if (!AudioCtx) return

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx()
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume()
    }

    setSoundEnabled(true)
  }

  const playSound = (type: "whoosh" | "capture" | "assemble" | "impact") => {
    const ctx = audioContextRef.current

    if (!ctx || ctx.state !== "running") return

    const now = ctx.currentTime

    if (type === "whoosh") {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      oscillator.type = "sawtooth"
      oscillator.frequency.setValueAtTime(120, now)
      oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.45)

      filter.type = "lowpass"
      filter.frequency.setValueAtTime(900, now)
      filter.frequency.exponentialRampToValueAtTime(4200, now + 0.4)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48)

      oscillator.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(now)
      oscillator.stop(now + 0.5)
    }

    if (type === "capture") {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = "triangle"
      oscillator.frequency.setValueAtTime(110, now)
      oscillator.frequency.exponentialRampToValueAtTime(48, now + 0.22)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(now)
      oscillator.stop(now + 0.3)
    }

    if (type === "impact") {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = "square"
      oscillator.frequency.setValueAtTime(70, now)
      oscillator.frequency.exponentialRampToValueAtTime(25, now + 0.35)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(now)
      oscillator.stop(now + 0.42)
    }

    if (type === "assemble") {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(180, now)
      oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.65)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(now)
      oscillator.stop(now + 0.85)
    }
  }

  /*
   * ------------------------------------------------------------
   * INTRO SEQUENCE
   * ------------------------------------------------------------
   *
   * 0    - 1.8s  : agents appear
   * 1.8  - 4.2s  : POV chaos / chase
   * 4.2  - 7.8s  : Arbyter lightning hunts agents
   * 7.8  - 9.8s  : captured energy forms the A
   * 9.8  - 12.8s : logo assembles
   * 12.8 - 14s   : clean logo hold
   */

  useEffect(() => {
    const sequence = [
      window.setTimeout(() => {
        setIntroPhase(1)
        playSound("whoosh")
      }, 1800),

      window.setTimeout(() => {
        setIntroPhase(2)
        playSound("whoosh")
      }, 4200),

      window.setTimeout(() => {
        setIntroPhase(3)
        playSound("capture")
      }, 7800),

      window.setTimeout(() => {
        setIntroPhase(4)
        playSound("assemble")
      }, 9800),

      window.setTimeout(() => {
        setIntroPhase(5)
        playSound("impact")
      }, 11600),

      window.setTimeout(() => {
        setIntroPhase(6)
      }, 12800),

      window.setTimeout(() => {
        setIntroDone(true)
      }, 14300),
    ]

    return () => {
      sequence.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)

    window.addEventListener("scroll", onScroll)

    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const unlockAudio = () => {
      startAudio()
    }

    window.addEventListener("pointerdown", unlockAudio, { once: true })

    return () => {
      window.removeEventListener("pointerdown", unlockAudio)
    }
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
      {/* ========================================================= */}
      {/* FULL SCREEN CINEMATIC INTRO */}
      {/* ========================================================= */}

      {!introDone && (
        <section
          className={`cinematic-intro fixed inset-0 z-[200] overflow-hidden bg-[#f8f9fc] ${
            introPhase >= 6 ? "intro-finished" : ""
          }`}
          onPointerDown={startAudio}
        >
          {/* CAMERA GRID */}
          <div className="absolute inset-0 cinematic-grid" />

          {/* MOVING LIGHT */}
          <div
            className={`camera-light ${
              introPhase >= 2 ? "camera-light-fast" : ""
            }`}
          />

          {/* AGENTS */}
          <div
            className={`intro-agents ${
              introPhase >= 2 ? "intro-agents-chaos" : ""
            } ${introPhase >= 3 ? "intro-agents-captured" : ""}`}
          >
            {shuffledAgents.map((agent, index) => (
              <div
                key={agent.name}
                className={`intro-agent agent-${index + 1}`}
                style={{
                  left: agent.x,
                  top: agent.y,
                  animationDelay: agent.delay,
                  animationDuration: agent.duration,
                }}
              >
                <div className="intro-agent-core">
                  <span className="intro-agent-dot" />
                  <span>{agent.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* FAST CAMERA MOTION */}
          <div
            className={`speed-lines ${
              introPhase >= 2 ? "speed-lines-active" : ""
            }`}
          >
            {Array.from({ length: 18 }).map((_, index) => (
              <span
                key={index}
                style={{
                  ["--i" as string]: index,
                }}
              />
            ))}
          </div>

          {/* ARBYTER HUNTER */}
          <div
            className={`arb-hunter ${
              introPhase >= 2 ? "arb-hunter-active" : ""
            } ${introPhase >= 3 ? "arb-hunter-finished" : ""}`}
          >
            <div className="hunter-core" />

            <div className="hunter-tail tail-1" />
            <div className="hunter-tail tail-2" />
            <div className="hunter-tail tail-3" />

            <div className="hunter-glow" />
          </div>

          {/* CAPTURE BURSTS */}
          <div
            className={`capture-field ${
              introPhase >= 3 ? "capture-field-active" : ""
            }`}
          >
            {Array.from({ length: 14 }).map((_, index) => (
              <span
                key={index}
                className={`capture-particle particle-${index + 1}`}
              />
            ))}
          </div>

          {/* ENERGY LINE */}
          <div
            className={`energy-line ${
              introPhase >= 3 ? "energy-line-active" : ""
            }`}
          >
            <span />
          </div>

          {/* TRANSFORMER-STYLE LOGO ASSEMBLY */}
          <div
            className={`transform-logo ${
              introPhase >= 4 ? "transform-logo-active" : ""
            } ${introPhase >= 5 ? "transform-logo-final" : ""}`}
          >
            <div className="logo-energy-ring ring-a" />
            <div className="logo-energy-ring ring-b" />

            <div className="logo-piece logo-piece-left">
              <div />
            </div>

            <div className="logo-piece logo-piece-right">
              <div />
            </div>

            <div className="logo-piece logo-piece-bottom">
              <div />
            </div>

            <div className="logo-piece logo-piece-inner">
              <div />
            </div>

            <div className="logo-dot-piece" />

            <Logo className="assembled-logo" />
          </div>

          {/* FINAL LIGHT */}
          <div
            className={`final-logo-light ${
              introPhase >= 5 ? "final-logo-light-active" : ""
            }`}
          />

          {/* AUDIO BUTTON */}
          <button
            onClick={(event) => {
              event.stopPropagation()
              startAudio()
            }}
            className="absolute bottom-6 right-6 z-[30] flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-[9px] font-bold tracking-[0.2em] text-black/45 backdrop-blur-xl"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                soundEnabled ? "bg-[#1300BA]" : "bg-black/20"
              }`}
            />
            {soundEnabled ? "SOUND ON" : "ENABLE SOUND"}
          </button>
        </section>
      )}

      {/* ========================================================= */}
      {/* NAV */}
      {/* ========================================================= */}

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
      {/* LAYER 02 — THE REASSEMBLY */}
      {/* ========================================================= */}

      <section className="relative flex min-h-[850px] items-center justify-center overflow-hidden bg-white">
        <div className="absolute inset-0 blueprint-grid" />

        <div className="relative z-10 w-full max-w-[1250px] px-5 md:px-8">
          <div className="text-center">
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

          <div className="relative mx-auto mt-14 h-[500px] max-w-[1050px]">
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

              {/* FOUNDATION */}

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
      {/* LAYER 03 */}
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
                [
                  "01",
                  "CONNECT",
                  "Bring your existing AI agents into one layer.",
                ],
                [
                  "02",
                  "OBSERVE",
                  "See activity, tools, data, decisions and interactions.",
                ],
                [
                  "03",
                  "GOVERN",
                  "Apply policies, permissions, boundaries and controls.",
                ],
                [
                  "04",
                  "INVESTIGATE",
                  "Trace failures, threats and unexpected behavior.",
                ],
                [
                  "05",
                  "ACT",
                  "Know what requires attention and what to do next.",
                ],
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
      {/* LAYER 04 */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden bg-white py-32">
        <div className="mx-auto max-w-[1250px] px-5 md:px-8">
          <SectionLabel>ONE LAYER ABOVE EVERY AGENT</SectionLabel>

          <div className="relative mt-12 overflow-hidden border border-black/10 bg-[#fafbfe] p-5 md:p-10">
            <div className="absolute inset-0 blueprint-grid opacity-50" />

            <div className="relative z-10 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
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
      {/* LAYER 05 CTA */}
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

      {/* ========================================================= */}
      {/* FOOTER */}
      {/* ========================================================= */}

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

                  <span className="text-sm font-medium">{detail}</span>
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

        /* ========================================================
           CINEMATIC INTRO
        ======================================================== */

        .cinematic-intro {
          transform: scale(1);
          opacity: 1;
          transition:
            opacity 1.2s ease,
            transform 1.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .cinematic-intro.intro-finished {
          opacity: 0;
          transform: scale(1.08);
          pointer-events: none;
        }

        .cinematic-grid {
          background-image:
            linear-gradient(rgba(0, 0, 0, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.035) 1px, transparent 1px);
          background-size: 55px 55px;
          mask-image: radial-gradient(
            circle at center,
            black 0%,
            transparent 80%
          );
        }

        .camera-light {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 500px;
          height: 500px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: radial-gradient(
            circle,
            rgba(19, 0, 186, 0.08),
            transparent 68%
          );
          filter: blur(12px);
          transition:
            transform 2s cubic-bezier(0.2, 0.8, 0.2, 1),
            opacity 1s ease;
        }

        .camera-light-fast {
          transform: translate(-50%, -50%) scale(1.8);
          opacity: 0.75;
        }

        /* AGENTS */

        .intro-agents {
          position: absolute;
          inset: 0;
          transition:
            transform 3s cubic-bezier(0.16, 1, 0.3, 1),
            filter 2s ease;
        }

        .intro-agents-chaos {
          transform: scale(1.35);
          filter: contrast(1.08);
        }

        .intro-agents-captured {
          transform: scale(1.15);
        }

        .intro-agent {
          position: absolute;
          z-index: 5;
          animation: cinematicAgentMove linear infinite;
          transition:
            opacity 0.35s ease,
            transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .intro-agents-captured .intro-agent {
          opacity: 0;
          transform: translate(
              calc(50vw - 50%),
              calc(50vh - 50%)
            )
            scale(0.02);
          transition-delay: calc(var(--i, 0) * 45ms);
        }

        .intro-agent-core {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.06);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: rgba(0, 0, 0, 0.45);
          white-space: nowrap;
        }

        .intro-agent-dot {
          height: 5px;
          width: 5px;
          border-radius: 999px;
          background: #1300ba;
          box-shadow: 0 0 12px rgba(19, 0, 186, 0.7);
        }

        @keyframes cinematicAgentMove {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }

          20% {
            transform: translate3d(130px, -90px, 0) rotate(8deg);
          }

          40% {
            transform: translate3d(-110px, 120px, 0) rotate(-11deg);
          }

          60% {
            transform: translate3d(150px, 70px, 0) rotate(13deg);
          }

          80% {
            transform: translate3d(-90px, -80px, 0) rotate(-7deg);
          }

          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
        }

        /* FAST & FURIOUS STYLE SPEED */

        .speed-lines {
          position: absolute;
          inset: -20%;
          z-index: 3;
          opacity: 0;
          transform: scale(0.6);
          transition:
            opacity 1s ease,
            transform 2s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
        }

        .speed-lines-active {
          opacity: 1;
          transform: scale(1.5);
        }

        .speed-lines span {
          position: absolute;
          left: 50%;
          top: 50%;
          width: calc(130px + (var(--i) * 22px));
          height: 1px;
          transform-origin: left center;
          transform: rotate(calc(var(--i) * 20deg))
            translateX(80px)
            scaleX(0.3);
          background: linear-gradient(
            90deg,
            rgba(19, 0, 186, 0),
            rgba(19, 0, 186, 0.32),
            rgba(19, 0, 186, 0)
          );
          animation: speedRush 0.8s linear infinite;
          animation-delay: calc(var(--i) * -0.08s);
        }

        @keyframes speedRush {
          0% {
            opacity: 0;
            transform: rotate(calc(var(--i) * 20deg))
              translateX(40px)
              scaleX(0.1);
          }

          45% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: rotate(calc(var(--i) * 20deg))
              translateX(700px)
              scaleX(1.4);
          }
        }

        /* ARBYTER HUNTER */

        .arb-hunter {
          position: absolute;
          left: -15%;
          top: 42%;
          z-index: 20;
          width: 180px;
          height: 80px;
          opacity: 0;
          transform: rotate(-9deg) scale(0.2);
          transition:
            left 3.4s cubic-bezier(0.16, 1, 0.3, 1),
            top 3.4s cubic-bezier(0.16, 1, 0.3, 1),
            transform 1s cubic-bezier(0.16, 1, 0.3, 1),
            opacity 0.4s ease;
        }

        .arb-hunter-active {
          left: 50%;
          top: 50%;
          opacity: 1;
          transform: translate(-50%, -50%) rotate(-5deg) scale(1);
        }

        .arb-hunter-finished {
          opacity: 0;
          transform: translate(-50%, -50%) scale(2.5);
        }

        .hunter-core {
          position: absolute;
          left: 50%;
          top: 50%;
          height: 22px;
          width: 22px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: #1300ba;
          box-shadow:
            0 0 10px #1300ba,
            0 0 35px rgba(19, 0, 186, 0.8),
            0 0 100px rgba(19, 0, 186, 0.45);
        }

        .hunter-tail {
          position: absolute;
          left: 50%;
          top: 50%;
          height: 3px;
          transform-origin: right center;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(19, 0, 186, 0.2),
            #1300ba
          );
          border-radius: 999px;
        }

        .tail-1 {
          width: 170px;
          transform: translate(-100%, -50%) rotate(10deg);
        }

        .tail-2 {
          width: 120px;
          transform: translate(-100%, -50%) rotate(-18deg);
          opacity: 0.7;
        }

        .tail-3 {
          width: 80px;
          transform: translate(-100%, -50%) rotate(28deg);
          opacity: 0.45;
        }

        .hunter-glow {
          position: absolute;
          inset: -100px;
          border-radius: 999px;
          background: radial-gradient(
            circle,
            rgba(19, 0, 186, 0.18),
            transparent 70%
          );
          filter: blur(15px);
        }

        /* CAPTURE PARTICLES */

        .capture-field {
          position: absolute;
          inset: 0;
          z-index: 21;
          pointer-events: none;
        }

        .capture-particle {
          position: absolute;
          left: 50%;
          top: 50%;
          height: 7px;
          width: 7px;
          border-radius: 999px;
          background: #1300ba;
          opacity: 0;
          box-shadow: 0 0 15px rgba(19, 0, 186, 0.8);
        }

        .capture-field-active .capture-particle {
          animation: particleCollect 1.4s
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .particle-1 {
          --x: -42vw;
          --y: -28vh;
        }

        .particle-2 {
          --x: 35vw;
          --y: -32vh;
        }

        .particle-3 {
          --x: -35vw;
          --y: 18vh;
        }

        .particle-4 {
          --x: 42vw;
          --y: 20vh;
        }

        .particle-5 {
          --x: -20vw;
          --y: -35vh;
        }

        .particle-6 {
          --x: 24vw;
          --y: 34vh;
        }

        .particle-7 {
          --x: -45vw;
          --y: 36vh;
        }

        .particle-8 {
          --x: 46vw;
          --y: -12vh;
        }

        .particle-9 {
          --x: -30vw;
          --y: -10vh;
        }

        .particle-10 {
          --x: 30vw;
          --y: 8vh;
        }

        .particle-11 {
          --x: -12vw;
          --y: 27vh;
        }

        .particle-12 {
          --x: 12vw;
          --y: -28vh;
        }

        .particle-13 {
          --x: -18vw;
          --y: 12vh;
        }

        .particle-14 {
          --x: 18vw;
          --y: -5vh;
        }

        @keyframes particleCollect {
          0% {
            opacity: 1;
            transform: translate(var(--x), var(--y)) scale(1.8);
          }

          60% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translate(0, 0) scale(0.1);
          }
        }

        /* ENERGY LINE */

        .energy-line {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 22;
          width: 0;
          height: 2px;
          transform: translate(-50%, -50%);
          opacity: 0;
          transition:
            width 1.2s cubic-bezier(0.16, 1, 0.3, 1),
            opacity 0.3s ease;
          background: #1300ba;
          box-shadow:
            0 0 12px #1300ba,
            0 0 40px rgba(19, 0, 186, 0.7);
        }

        .energy-line-active {
          width: min(420px, 70vw);
          opacity: 1;
        }

        .energy-line span {
          position: absolute;
          inset: -15px 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(19, 0, 186, 0.5),
            transparent
          );
          filter: blur(7px);
        }

        /* TRANSFORMER LOGO */

        .transform-logo {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 25;
          width: 300px;
          height: 270px;
          transform: translate(-50%, -50%) scale(0.35);
          opacity: 0;
          perspective: 900px;
          transition:
            opacity 0.4s ease,
            transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .transform-logo-active {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        .transform-logo-final {
          transform: translate(-50%, -50%) scale(1.08);
        }

        .assembled-logo {
          position: absolute;
          inset: 50%;
          width: 170px;
          height: 155px;
          transform: translate(-50%, -50%) scale(0);
          opacity: 0;
          filter: drop-shadow(0 0 20px rgba(19, 0, 186, 0.35));
          transition:
            opacity 0.4s ease,
            transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .transform-logo-final .assembled-logo {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        .logo-piece {
          position: absolute;
          z-index: 3;
          background: #000;
          box-shadow:
            0 0 15px rgba(0, 0, 0, 0.18),
            0 0 35px rgba(19, 0, 186, 0.12);
          transition:
            transform 1.1s cubic-bezier(0.16, 1, 0.3, 1),
            opacity 0.6s ease;
        }

        .logo-piece-left {
          left: 62px;
          top: 30px;
          width: 48px;
          height: 190px;
          clip-path: polygon(
            50% 0,
            100% 20%,
            70% 100%,
            0 100%,
            25% 45%
          );
          transform: translate(-260px, 180px) rotate(-42deg);
        }

        .logo-piece-right {
          right: 52px;
          top: 22px;
          width: 65px;
          height: 200px;
          clip-path: polygon(
            0 0,
            100% 42%,
            100% 100%,
            35% 100%,
            20% 55%
          );
          transform: translate(260px, -190px) rotate(48deg);
        }

        .logo-piece-bottom {
          left: 55px;
          bottom: 22px;
          width: 190px;
          height: 48px;
          clip-path: polygon(
            0 0,
            100% 0,
            84% 100%,
            10% 100%
          );
          transform: translate(-220px, 220px) rotate(18deg);
        }

        .logo-piece-inner {
          left: 100px;
          top: 95px;
          width: 100px;
          height: 75px;
          background: white;
          clip-path: polygon(50% 0, 100% 100%, 0 100%);
          transform: translate(190px, 180px) rotate(-55deg);
          box-shadow: none;
        }

        .logo-dot-piece {
          position: absolute;
          right: 37px;
          top: 23px;
          z-index: 5;
          height: 42px;
          width: 42px;
          border-radius: 999px;
          background: #1300ba;
          box-shadow:
            0 0 18px rgba(19, 0, 186, 0.8),
            0 0 50px rgba(19, 0, 186, 0.35);
          transform: translate(240px, -180px) scale(0.2);
          transition:
            transform 1s cubic-bezier(0.16, 1, 0.3, 1),
            opacity 0.4s ease;
        }

        .transform-logo-active .logo-piece-left {
          transform: translate(0, 0) rotate(0);
        }

        .transform-logo-active .logo-piece-right {
          transform: translate(0, 0) rotate(0);
        }

        .transform-logo-active .logo-piece-bottom {
          transform: translate(0, 0) rotate(0);
        }

        .transform-logo-active .logo-piece-inner {
          transform: translate(0, 0) rotate(0);
        }

        .transform-logo-active .logo-dot-piece {
          transform: translate(0, 0) scale(1);
        }

        .logo-energy-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          border: 1px solid rgba(19, 0, 186, 0.25);
          border-radius: 999px;
          transform: translate(-50%, -50%) scale(0.2);
          opacity: 0;
        }

        .ring-a {
          width: 280px;
          height: 280px;
        }

        .ring-b {
          width: 380px;
          height: 380px;
        }

        .transform-logo-active .logo-energy-ring {
          opacity: 1;
          animation: logoRing 1.6s ease-out forwards;
        }

        @keyframes logoRing {
          from {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 0;
          }

          45% {
            opacity: 1;
          }

          to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }

        /* FINAL FLASH */

        .final-logo-light {
          position: absolute;
          inset: 0;
          z-index: 28;
          background: white;
          opacity: 0;
          pointer-events: none;
        }

        .final-logo-light-active {
          animation: finalFlash 0.75s ease-out forwards;
        }

        @keyframes finalFlash {
          0% {
            opacity: 0;
          }

          35% {
            opacity: 0.92;
          }

          100% {
            opacity: 0;
          }
        }

        /* ========================================================
           EXISTING PAGE
        ======================================================== */

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
            linear-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.12) 1px, transparent 1px);
          background-size: 32px 32px;
        }

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
          animation: pieceAssemble 1.8s cubic-bezier(0.2, 0.8, 0.2, 1)
            forwards;
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
          .speed-lines span {
            width: 160px;
          }

          .transform-logo {
            transform: translate(-50%, -50%) scale(0.75);
          }

          .transform-logo-active {
            transform: translate(-50%, -50%) scale(0.8);
          }

          .transform-logo-final {
            transform: translate(-50%, -50%) scale(0.85);
          }

          .intro-agent-core {
            padding: 6px 8px;
            font-size: 7px;
          }

          .logo-piece {
            opacity: 0.9;
          }

          .fortress-piece {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .intro-agent,
          .speed-lines span,
          .capture-particle,
          .logo-energy-ring {
            animation: none !important;
          }

          .cinematic-intro {
            transition: none;
          }
        }
      `}</style>
    </main>
  )
}