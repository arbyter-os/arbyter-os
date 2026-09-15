"use client";

import { useEffect, useState } from "react";

const pillars = [
  {
    id: "governance",
    title: "GOVERNANCE",
    subtitle: "Define how agents operate.",
    description:
      "Set organizational rules, ethical boundaries, policies and accountability structures for every AI agent.",
    points: [
      "Organizational policies",
      "Agent accountability",
      "Ethical boundaries",
      "Governance workflows",
    ],
  },
  {
    id: "control",
    title: "CONTROL",
    subtitle: "Decide what agents can do.",
    description:
      "Control agent permissions, tools, actions and operating boundaries before they become business risk.",
    points: [
      "Permissions",
      "Tool access",
      "Action boundaries",
      "Kill switch",
    ],
  },
  {
    id: "visibility",
    title: "VISIBILITY",
    subtitle: "See what agents are doing.",
    description:
      "Understand agent activity, interactions, tasks, tools, decisions and behavior across the organization.",
    points: [
      "Live activity",
      "Agent interactions",
      "Tool usage",
      "Behavior monitoring",
    ],
  },
  {
    id: "audit",
    title: "AUDIT",
    subtitle: "Know what happened.",
    description:
      "Create a traceable record of important agent actions, decisions, events and failures.",
    points: [
      "Activity history",
      "Decision trails",
      "Evidence",
      "Investigations",
    ],
  },
  {
    id: "security",
    title: "SECURITY",
    subtitle: "Protect the agent layer.",
    description:
      "Detect suspicious behavior, unauthorized access, dangerous actions and threats across connected agents.",
    points: [
      "Threat detection",
      "Access controls",
      "Security monitoring",
      "Isolation",
    ],
  },
  {
    id: "compliance",
    title: "COMPLIANCE",
    subtitle: "Keep AI within the rules.",
    description:
      "Map agent behavior against organizational, regulatory and government requirements.",
    points: [
      "Policy monitoring",
      "Regulatory rules",
      "Government requirements",
      "Compliance evidence",
    ],
  },
  {
    id: "investigation",
    title: "INVESTIGATION",
    subtitle: "Understand when things go wrong.",
    description:
      "Move from an alert to the actual cause by tracing what an agent did, why it happened and what was affected.",
    points: [
      "Incident timelines",
      "Root-cause analysis",
      "Agent history",
      "Evidence collection",
    ],
  },
  {
    id: "risk",
    title: "RISK",
    subtitle: "Know what could hurt the business.",
    description:
      "Identify behavior that creates financial, operational, security, privacy or regulatory risk.",
    points: [
      "Risk scoring",
      "Business impact",
      "Policy violations",
      "Recommended action",
    ],
  },
];

const agents = [
  { x: "8%", y: "23%", label: "Research Agent" },
  { x: "18%", y: "70%", label: "Sales Agent" },
  { x: "31%", y: "19%", label: "Finance Agent" },
  { x: "42%", y: "76%", label: "Support Agent" },
  { x: "55%", y: "18%", label: "Operations Agent" },
  { x: "67%", y: "72%", label: "Data Agent" },
  { x: "78%", y: "26%", label: "Security Agent" },
  { x: "91%", y: "61%", label: "Custom Agent" },
];

export default function Home() {
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((current) => (current + 1) % 4);
    }, 2600);

    return () => clearInterval(timer);
  }, []);

  const selected = pillars.find((pillar) => pillar.id === activePillar);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-[#1300BA] selection:text-white">
      {/* GLOBAL STYLE */}
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #050505;
          font-family:
            Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        @keyframes float {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -14px, 0);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.92);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }

        @keyframes scan {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes capture {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          70% {
            opacity: 0.8;
          }
          100% {
            transform: translate(50vw, 10vh) scale(0.1);
            opacity: 0;
          }
        }

        @keyframes reveal {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes beam {
          0% {
            opacity: 0;
            height: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            height: 100%;
          }
        }

        .hero-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
          background-size: 55px 55px;
        }

        .glass {
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.09);
          backdrop-filter: blur(20px);
        }

        .capture-agent {
          animation: capture 3s cubic-bezier(.7,0,.2,1) infinite;
        }

        .floating {
          animation: float 5s ease-in-out infinite;
        }

        .reveal {
          animation: reveal 1s cubic-bezier(.16,1,.3,1) forwards;
        }
      `}</style>

      {/* NAV */}
      <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-white/10 bg-black/55 px-6 py-4 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-3">
          {/* ACTUAL ARBYTER SVG */}
          <svg
            width="34"
            height="31"
            viewBox="0 0 456 406"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Arbyter"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M 166.5 46
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
                 Z"
              fill="#000000"
              stroke="white"
              strokeWidth="1"
            />
            <circle cx="356" cy="49" r="49" fill="#1300BA" />
          </svg>

          <span className="text-sm font-semibold tracking-[0.2em]">
            ARBYTER OS
          </span>
        </div>

        <div className="hidden gap-8 text-xs tracking-[0.16em] text-white/55 md:flex">
          <a href="#story" className="transition hover:text-white">
            STORY
          </a>
          <a href="#pillars" className="transition hover:text-white">
            PILLARS
          </a>
          <a href="#system" className="transition hover:text-white">
            SYSTEM
          </a>
        </div>

        <button className="rounded-full border border-white/20 px-5 py-2 text-xs font-medium tracking-wide transition hover:border-white/50 hover:bg-white/10">
          ENTER ARBYTER
        </button>
      </nav>

      {/* HERO / STORY */}
      <section
        id="story"
        className="hero-grid relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(19,0,186,.18),transparent_42%)]" />

        {/* scan line */}
        <div className="absolute left-0 top-1/2 h-px w-full overflow-hidden bg-white/5">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#1300BA] to-transparent animate-[scan_4s_linear_infinite]" />
        </div>

        {/* SCATTERED AGENTS */}
        {agents.map((agent, index) => (
          <div
            key={agent.label}
            className={`absolute z-10 transition-all duration-[1800ms] ${
              phase >= 2 ? "opacity-0 scale-0" : "opacity-100"
            }`}
            style={{
              left: agent.x,
              top: agent.y,
              transitionDelay: `${index * 90}ms`,
            }}
          >
            <div className="glass floating relative rounded-2xl px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#1300BA] shadow-[0_0_14px_#1300BA]" />
                <span className="whitespace-nowrap text-[10px] text-white/65">
                  {agent.label}
                </span>
              </div>

              <div className="mt-2 flex gap-1">
                <span className="h-1 w-5 rounded bg-white/10" />
                <span className="h-1 w-8 rounded bg-white/10" />
                <span className="h-1 w-3 rounded bg-[#1300BA]/60" />
              </div>
            </div>
          </div>
        ))}

        {/* CAPTURE CORE */}
        <div
          className={`relative z-20 flex h-[300px] w-[300px] items-center justify-center rounded-full transition-all duration-[1800ms] ${
            phase >= 2
              ? "scale-125 opacity-100"
              : "scale-75 opacity-0"
          }`}
        >
          <div className="absolute inset-0 rounded-full border border-[#1300BA]/30 shadow-[0_0_100px_rgba(19,0,186,.35)]" />
          <div className="absolute inset-8 rounded-full border border-white/10" />
          <div className="absolute inset-20 rounded-full bg-[#1300BA]/10 blur-2xl" />

          <div className="relative z-10 flex flex-col items-center">
            <svg
              width="90"
              height="80"
              viewBox="0 0 456 406"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M 166.5 46
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
                   Z"
                fill="white"
              />
              <circle cx="356" cy="49" r="49" fill="#1300BA" />
            </svg>

            <div className="mt-5 text-xl font-semibold tracking-[.3em]">
              ARBYTER.OS
            </div>

            <div className="mt-2 text-[10px] uppercase tracking-[.35em] text-white/40">
              Agent Governance Layer
            </div>
          </div>
        </div>

        {/* HERO COPY */}
        <div
          className={`absolute bottom-12 left-6 z-30 max-w-xl transition-all duration-1000 md:left-12 ${
            phase >= 2 ? "opacity-0 translate-y-10" : "opacity-100"
          }`}
        >
          <p className="mb-5 text-xs font-medium uppercase tracking-[.3em] text-[#8f87ff]">
            The agent layer is changing.
          </p>

          <h1 className="text-5xl font-semibold leading-[.92] tracking-[-.045em] md:text-8xl">
            Your agents
            <br />
            are everywhere.
          </h1>

          <p className="mt-7 max-w-md text-sm leading-6 text-white/45">
            Autonomous agents are entering every part of the enterprise.
            Different tools. Different decisions. Different risks.
          </p>
        </div>

        {/* PHASE 2 COPY */}
        <div
          className={`absolute z-30 max-w-3xl text-center transition-all duration-1000 ${
            phase >= 2
              ? "reveal opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          <p className="mb-5 text-xs uppercase tracking-[.35em] text-[#8f87ff]">
            One layer above every agent
          </p>

          <h2 className="text-5xl font-semibold tracking-[-.05em] md:text-8xl">
            Arbyter
            <span className="text-[#1300BA]">.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/45">
            Connect any agent. See what it does. Govern how it operates.
            Detect what goes wrong. Take action.
          </p>
        </div>
      </section>

      {/* TRANSFORMATION */}
      <section className="relative overflow-hidden border-t border-white/10 px-6 py-32 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-12 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[.3em] text-[#8f87ff]">
                From scattered intelligence
              </p>

              <h2 className="mt-5 max-w-3xl text-5xl font-semibold leading-[.95] tracking-[-.045em] md:text-7xl">
                Into one
                <br />
                governed system.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-white/45">
              Arbyter doesn't replace your agents. It becomes the layer that
              watches over them — connecting intelligence with governance,
              security and accountability.
            </p>
          </div>

          {/* SYSTEM VISUAL */}
          <div
            id="system"
            className="relative mt-24 min-h-[620px] overflow-hidden rounded-[40px] border border-white/10 bg-[#080808]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(19,0,186,.16),transparent_35%)]" />

            {/* CENTRAL FORTRESS */}
            <div className="absolute left-1/2 top-1/2 w-[90%] max-w-5xl -translate-x-1/2 -translate-y-1/2">
              {/* crown */}
              <div className="mx-auto flex w-fit flex-col items-center">
                <div className="mb-4 h-10 w-px bg-gradient-to-b from-transparent to-[#1300BA]" />

                <div className="glass relative flex items-center gap-4 rounded-2xl px-7 py-5 shadow-[0_0_80px_rgba(19,0,186,.18)]">
                  <svg
                    width="42"
                    height="38"
                    viewBox="0 0 456 406"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M 166.5 46
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
                         Z"
                      fill="white"
                    />
                    <circle cx="356" cy="49" r="49" fill="#1300BA" />
                  </svg>

                  <div>
                    <div className="text-lg font-semibold tracking-[.18em]">
                      ARBYTER OS
                    </div>
                    <div className="mt-1 text-[9px] uppercase tracking-[.3em] text-white/35">
                      Orchestrate. Govern. Secure.
                    </div>
                  </div>
                </div>
              </div>

              {/* fortress body */}
              <div className="relative mt-7 grid grid-cols-2 gap-2 md:grid-cols-4">
                {pillars.map((pillar, index) => (
                  <button
                    key={pillar.id}
                    onClick={() => setActivePillar(pillar.id)}
                    className="group relative min-h-[190px] overflow-hidden rounded-t-[22px] border border-white/10 bg-gradient-to-b from-white/[.06] to-white/[.015] p-5 text-left transition duration-500 hover:-translate-y-3 hover:border-[#1300BA]/60 hover:bg-[#1300BA]/10"
                  >
                    <div className="absolute bottom-0 left-1/2 h-1/2 w-px -translate-x-1/2 bg-gradient-to-t from-[#1300BA]/70 to-transparent opacity-0 transition group-hover:opacity-100" />

                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <span className="text-[9px] text-white/25">
                        0{index + 1}
                      </span>

                      <div>
                        <div className="mb-2 h-px w-8 bg-[#1300BA]" />
                        <h3 className="text-xs font-semibold tracking-[.12em]">
                          {pillar.title}
                        </h3>
                        <p className="mt-2 text-[10px] leading-4 text-white/35">
                          {pillar.subtitle}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* foundation */}
              <div className="mx-auto mt-2 h-5 w-[90%] rounded-b-xl border-x border-b border-white/10 bg-white/[.025]" />
            </div>

            {/* background network */}
            <div className="absolute inset-x-10 bottom-8 flex justify-between opacity-20">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-1 w-1 rounded-full bg-[#1300BA] shadow-[0_0_15px_#1300BA]"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PILLAR DETAILS */}
      <section id="pillars" className="border-t border-white/10 px-6 py-32 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs uppercase tracking-[.3em] text-[#8f87ff]">
              The architecture
            </p>

            <h2 className="mt-5 text-5xl font-semibold tracking-[-.045em] md:text-7xl">
              Eight pillars.
              <br />
              One system.
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, index) => (
              <button
                key={pillar.id}
                onClick={() => setActivePillar(pillar.id)}
                className="group min-h-[260px] bg-[#070707] p-7 text-left transition hover:bg-[#0c0c0c]"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs text-white/20">
                    0{index + 1}
                  </span>

                  <span className="text-[#1300BA] transition group-hover:translate-x-1">
                    →
                  </span>
                </div>

                <div className="mt-20">
                  <h3 className="text-sm font-semibold tracking-[.18em]">
                    {pillar.title}
                  </h3>

                  <p className="mt-3 text-xs leading-5 text-white/35">
                    {pillar.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative flex min-h-[75vh] items-center justify-center overflow-hidden border-t border-white/10 px-6 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(19,0,186,.22),transparent_45%)]" />

        <div className="relative z-10">
          <svg
            className="mx-auto mb-8"
            width="76"
            height="68"
            viewBox="0 0 456 406"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M 166.5 46
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
                 Z"
              fill="white"
            />
            <circle cx="356" cy="49" r="49" fill="#1300BA" />
          </svg>

          <p className="text-xs uppercase tracking-[.35em] text-white/35">
            The layer above your agents
          </p>

          <h2 className="mt-7 text-6xl font-semibold tracking-[-.06em] md:text-9xl">
            ARBYTER<span className="text-[#1300BA]">.</span>
          </h2>

          <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-white/40">
            Orchestrate intelligence.
            <br />
            Govern autonomous systems.
            <br />
            Secure the agentic enterprise.
          </p>

          <button className="mt-10 rounded-full bg-white px-7 py-3 text-xs font-semibold text-black transition hover:bg-[#1300BA] hover:text-white">
            ENTER ARBYTER OS
          </button>
        </div>
      </section>

      {/* PILLAR MODAL */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-5 backdrop-blur-xl"
          onClick={() => setActivePillar(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl md:p-12"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setActivePillar(null)}
              className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              ×
            </button>

            <div className="mb-10">
              <div className="mb-4 text-[10px] uppercase tracking-[.3em] text-[#8f87ff]">
                Arbyter OS / Pillar
              </div>

              <h2 className="text-4xl font-semibold tracking-[-.04em]">
                {selected.title}
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-7 text-white/45">
                {selected.description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {selected.points.map((point) => (
                <div
                  key={point}
                  className="rounded-xl border border-white/10 bg-white/[.025] p-4"
                >
                  <div className="mb-3 h-1.5 w-1.5 rounded-full bg-[#1300BA]" />
                  <div className="text-xs text-white/70">{point}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-white/10 pt-6 text-[10px] uppercase tracking-[.25em] text-white/25">
              Click another pillar to explore
            </div>
          </div>
        </div>
      )}
    </main>
  );
}