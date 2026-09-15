"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BLUE = "#1300BA";

const LOGO = (
  <svg
    viewBox="0 0 456 406"
    width="100%"
    height="100%"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
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
    <circle cx="356" cy="49" r="49" fill="#1300BA" />
  </svg>
);

const pillars = [
  {
    name: "Governance",
    short: "GOV",
    description:
      "Define how AI agents are allowed to operate across the organization.",
  },
  {
    name: "Control",
    short: "CTL",
    description:
      "Set boundaries, permissions, tool access and intervention mechanisms.",
  },
  {
    name: "Visibility",
    short: "VIS",
    description:
      "See what agents are doing, using, deciding and interacting with.",
  },
  {
    name: "Audit",
    short: "AUD",
    description:
      "Create a continuous record of agent activity, decisions and outcomes.",
  },
  {
    name: "Security",
    short: "SEC",
    description:
      "Detect unauthorized access, threats, unsafe behavior and abnormal activity.",
  },
  {
    name: "Compliance",
    short: "CMP",
    description:
      "Map agent behavior against organizational, legal and regulatory requirements.",
  },
  {
    name: "Investigation",
    short: "INV",
    description:
      "Trace incidents from what happened to why it happened and what to do next.",
  },
  {
    name: "Risk",
    short: "RSK",
    description:
      "Identify business, financial, operational and security risks before they escalate.",
  },
];

const agents = [
  { x: 10, y: 20, size: 9 },
  { x: 22, y: 69, size: 7 },
  { x: 36, y: 28, size: 8 },
  { x: 47, y: 76, size: 10 },
  { x: 61, y: 18, size: 7 },
  { x: 73, y: 66, size: 8 },
  { x: 88, y: 25, size: 9 },
  { x: 82, y: 81, size: 7 },
  { x: 15, y: 48, size: 6 },
  { x: 91, y: 52, size: 8 },
];

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [phase, setPhase] = useState(0);
  const [activePillar, setActivePillar] = useState<number | null>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 700),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3800),
      setTimeout(() => setPhase(4), 5000),
      setTimeout(() => setIntroDone(true), 6200),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className="min-h-screen bg-white text-black overflow-x-hidden">
      {!introDone && (
        <Intro phase={phase} />
      )}

      <div
        className={`transition-opacity duration-1000 ${
          introDone ? "opacity-100" : "opacity-0"
        }`}
      >
        <TopBar />

        {/* =========================================================
            LAYER 01 — HERO
        ========================================================== */}
        <section className="relative min-h-[calc(100vh-78px)] flex items-center justify-center overflow-hidden border-b border-black/10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[8%] top-[20%] h-px w-[84%] bg-black/5" />
            <div className="absolute left-[18%] top-[50%] h-px w-[64%] bg-black/5" />
            <div className="absolute left-[50%] top-0 h-full w-px bg-black/5" />
          </div>

          <div className="relative z-10 max-w-6xl px-6 text-center">
            <div className="mx-auto mb-10 h-20 w-20">
              {LOGO}
            </div>

            <p
              className="mb-5 text-xs tracking-[0.35em] text-black/50"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              AI GOVERNANCE INFRASTRUCTURE
            </p>

            <h1
              className="text-[clamp(3.8rem,10vw,9rem)] font-black leading-[0.82] tracking-[-0.07em]"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              ARBYTER
            </h1>

            <p
              className="mt-7 text-sm uppercase tracking-[0.35em]"
              style={{ color: BLUE }}
            >
              Orchestrate. Govern. Secure.
            </p>

            <p className="mx-auto mt-8 max-w-xl text-base leading-7 text-black/55">
              The control layer between your organization and its AI agents.
              Connect them. Understand them. Govern them.
            </p>

            <div className="mt-10 flex justify-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-black px-7 py-3 text-sm font-medium text-white transition hover:bg-[#1300BA]"
              >
                Request a demo
              </Link>

              <a
                href="#system"
                className="rounded-full border border-black/15 px-7 py-3 text-sm font-medium transition hover:border-black"
              >
                Explore Arbyter
              </a>
            </div>
          </div>
        </section>

        {/* =========================================================
            LAYER 02 — THE FORTRESS
            IMPORTANT: top spacing keeps it BELOW THE TOPBAR.
        ========================================================== */}
        <section
          id="system"
          className="relative overflow-hidden border-b border-black/10"
          style={{
            paddingTop: "110px",
          }}
        >
          <div className="px-6 pb-10 text-center">
            <p className="text-xs font-medium tracking-[0.35em] text-black/40">
              LAYER 02
            </p>

            <h2 className="mt-4 text-5xl font-black tracking-[-0.05em] md:text-7xl">
              THE ARBYTER SYSTEM
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-black/50">
              Eight structural pillars turn autonomous AI activity into
              something an organization can understand, control and govern.
            </p>
          </div>

          <div className="fortress-stage relative mx-auto min-h-[760px] max-w-[1250px] px-6">
            {/* Roof / Crown */}
            <div className="absolute left-1/2 top-[25px] z-20 w-[280px] -translate-x-1/2 md:w-[390px]">
              <div className="relative border-2 border-black bg-white px-8 py-6 text-center shadow-[8px_8px_0_#1300BA]">
                <div className="mx-auto mb-4 h-10 w-10">
                  {LOGO}
                </div>

                <div className="text-xl font-black tracking-[-0.03em]">
                  ARBYTER OS
                </div>

                <div
                  className="mt-1 text-[9px] tracking-[0.3em]"
                  style={{ color: BLUE }}
                >
                  ORCHESTRATE · GOVERN · SECURE
                </div>
              </div>
            </div>

            {/* Fortress */}
            <div className="absolute left-1/2 top-[185px] w-[94%] -translate-x-1/2">
              <div className="relative border-x-2 border-t-2 border-black bg-white px-4 pt-10">
                {/* Pillars */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {pillars.map((pillar, index) => (
                    <button
                      key={pillar.name}
                      onClick={() => setActivePillar(index)}
                      className="group relative min-h-[240px] border-2 border-black bg-white p-5 text-left transition duration-300 hover:-translate-y-2 hover:bg-black hover:text-white"
                    >
                      <div
                        className="absolute left-0 top-0 h-1 w-full opacity-0 transition group-hover:opacity-100"
                        style={{ backgroundColor: BLUE }}
                      />

                      <div className="flex h-full flex-col justify-between">
                        <div>
                          <span
                            className="text-[10px] font-bold tracking-[0.3em]"
                            style={{ color: BLUE }}
                          >
                            {pillar.short}
                          </span>

                          <h3 className="mt-5 text-xl font-black tracking-[-0.03em]">
                            {pillar.name}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-black/40 group-hover:text-white/40">
                            Explore
                          </span>

                          <span
                            className="text-lg transition group-hover:translate-x-1"
                            style={{ color: BLUE }}
                          >
                            →
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Inner command deck */}
                <div className="mt-4 border-2 border-black bg-black px-6 py-8 text-white">
                  <div className="grid gap-8 md:grid-cols-3">
                    <div>
                      <div className="text-[9px] tracking-[0.3em] text-white/40">
                        OBSERVE
                      </div>
                      <div className="mt-2 text-xl font-bold">
                        What is happening?
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] tracking-[0.3em] text-white/40">
                        UNDERSTAND
                      </div>
                      <div className="mt-2 text-xl font-bold">
                        Why is it happening?
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] tracking-[0.3em] text-white/40">
                        ACT
                      </div>
                      <div className="mt-2 text-xl font-bold">
                        What should happen next?
                      </div>
                    </div>
                  </div>
                </div>

                {/* Foundation */}
                <div className="relative mt-4 h-[130px] overflow-hidden border-2 border-black bg-white">
                  <div className="absolute inset-0 opacity-[0.08]">
                    <div className="grid h-full grid-cols-10">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="border-r border-black"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="relative flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="text-[9px] tracking-[0.35em] text-black/40">
                        FOUNDATION
                      </div>

                      <div className="mt-3 text-3xl font-black tracking-[-0.04em]">
                        AI AGENTS
                      </div>

                      <div className="mt-2 text-xs text-black/40">
                        Connected · Observed · Governed
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fortress base */}
                <div
                  className="mx-auto h-4 w-[110%] -translate-x-[4.5%]"
                  style={{ backgroundColor: BLUE }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            LAYER 03 — SYSTEM
        ========================================================== */}
        <section className="border-b border-black/10 py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-16 md:grid-cols-2 md:items-end">
              <div>
                <p
                  className="text-xs tracking-[0.35em]"
                  style={{ color: BLUE }}
                >
                  LAYER 03
                </p>

                <h2 className="mt-5 text-5xl font-black leading-[0.95] tracking-[-0.05em] md:text-7xl">
                  ONE LAYER.
                  <br />
                  EVERY AGENT.
                </h2>
              </div>

              <p className="max-w-lg text-lg leading-8 text-black/50">
                Arbyter sits above your AI infrastructure and below your
                organization. It gives every agent a common layer for
                observation, governance, security and accountability.
              </p>
            </div>

            <div className="mt-20 grid border-2 border-black md:grid-cols-4">
              {[
                ["01", "CONNECT", "Bring third-party or homegrown agents into one environment."],
                ["02", "OBSERVE", "Track activity, tools, decisions, interactions and failures."],
                ["03", "GOVERN", "Apply policies, boundaries, permissions and controls."],
                ["04", "RESPOND", "Investigate risks and decide what should happen next."],
              ].map(([num, title, text]) => (
                <div
                  key={num}
                  className="min-h-[270px] border-b-2 border-black p-7 last:border-b-0 md:border-b-0 md:border-r-2 md:last:border-r-0"
                >
                  <div
                    className="text-xs tracking-[0.3em]"
                    style={{ color: BLUE }}
                  >
                    {num}
                  </div>

                  <h3 className="mt-14 text-2xl font-black">
                    {title}
                  </h3>

                  <p className="mt-4 text-sm leading-6 text-black/50">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            LAYER 04 — ARCHITECTURE
        ========================================================== */}
        <section className="border-b border-black/10 bg-black py-32 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-16 md:grid-cols-[1fr_1.2fr] md:items-center">
              <div>
                <p
                  className="text-xs tracking-[0.35em]"
                  style={{ color: "#5A4DFF" }}
                >
                  LAYER 04
                </p>

                <h2 className="mt-5 text-5xl font-black leading-[0.95] tracking-[-0.05em] md:text-7xl">
                  FROM
                  <br />
                  AGENTS
                  <br />
                  TO SYSTEM.
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  "AI AGENTS",
                  "CONNECTIONS",
                  "IDENTITIES",
                  "ACTIVITY",
                  "DECISIONS",
                  "POLICIES",
                  "RISK",
                  "ORGANIZATION",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center justify-between border-b border-white/10 py-5"
                  >
                    <div className="flex items-center gap-5">
                      <span className="text-xs text-white/30">
                        0{index + 1}
                      </span>
                      <span className="font-bold tracking-wide">
                        {item}
                      </span>
                    </div>

                    <span style={{ color: "#5A4DFF" }}>→</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            LAYER 05 — CTA
        ========================================================== */}
        <section className="relative overflow-hidden py-36">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1300BA]/5 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <div className="mx-auto mb-10 h-16 w-16">
              {LOGO}
            </div>

            <p className="text-xs tracking-[0.35em] text-black/40">
              LAYER 05
            </p>

            <h2 className="mt-5 text-5xl font-black leading-[0.9] tracking-[-0.06em] md:text-8xl">
              YOUR AGENTS
              <br />
              NEED A SYSTEM.
            </h2>

            <p className="mx-auto mt-8 max-w-xl text-base leading-7 text-black/50">
              Build an AI organization that can move fast without losing
              visibility, control or accountability.
            </p>

            <Link
              href="/login"
              className="mt-10 inline-flex rounded-full bg-black px-8 py-4 text-sm font-medium text-white transition hover:bg-[#1300BA]"
            >
              Enter Arbyter →
            </Link>
          </div>
        </section>

        {/* =========================================================
            FOOTER
        ========================================================== */}
        <footer className="border-t border-black/10 px-6 py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7">{LOGO}</div>

              <span className="text-sm font-bold">
                ARBYTER OS
              </span>
            </div>

            <div className="text-xs text-black/40">
              ORCHESTRATE · GOVERN · SECURE
            </div>

            <a
              href="mailto:arbyteros@gmail.com"
              className="text-xs text-black/50 hover:text-black"
            >
              arbyteros@gmail.com
            </a>
          </div>
        </footer>
      </div>

      {/* =========================================================
          PILLAR MODAL
      ========================================================== */}
      {activePillar !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={() => setActivePillar(null)}
        >
          <div
            className="relative w-full max-w-xl border-2 border-black bg-white p-8 shadow-[12px_12px_0_#1300BA] md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePillar(null)}
              className="absolute right-5 top-5 text-xl"
            >
              ×
            </button>

            <div
              className="text-xs font-bold tracking-[0.3em]"
              style={{ color: BLUE }}
            >
              {pillars[activePillar].short}
            </div>

            <h3 className="mt-5 text-4xl font-black tracking-[-0.04em]">
              {pillars[activePillar].name}
            </h3>

            <p className="mt-6 text-base leading-7 text-black/55">
              {pillars[activePillar].description}
            </p>

            <div className="mt-10 border-t border-black/10 pt-6">
              <div className="text-xs tracking-[0.25em] text-black/35">
                ARBYTER OS
              </div>

              <div className="mt-2 text-sm">
                Intelligence with accountability.
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ===============================================================
   INTRO
================================================================ */

function Intro({ phase }: { phase: number }) {
  const decagonPoints = Array.from({ length: 10 }, (_, i) => {
    const angle = (i * 360) / 10 - 90;
    const radius = 170;

    return {
      x: 50 + (Math.cos((angle * Math.PI) / 180) * radius) / 10,
      y: 50 + (Math.sin((angle * Math.PI) / 180) * radius) / 10,
    };
  });

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden bg-white">
      {/* scattered agents */}
      {agents.map((agent, index) => {
        const target = decagonPoints[index];

        return (
          <div
            key={index}
            className="absolute transition-all ease-[cubic-bezier(.77,0,.18,1)]"
            style={{
              left: `${phase >= 2 ? target.x : agent.x}%`,
              top: `${phase >= 2 ? target.y : agent.y}%`,
              transform: "translate(-50%, -50%)",
              transitionDuration: `${900 + index * 70}ms`,
              opacity: phase >= 4 ? 0 : 1,
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: `${agent.size}px`,
                height: `${agent.size}px`,
                backgroundColor: index % 3 === 0 ? BLUE : "#000",
                boxShadow:
                  phase >= 2
                    ? `0 0 18px ${BLUE}`
                    : "none",
              }}
            />
          </div>
        );
      })}

      {/* Arbyter dot */}
      <div
        className={`absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 transition-all duration-[900ms] ${
          phase >= 1 ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      >
        <div
          className="h-5 w-5 rounded-full"
          style={{
            backgroundColor: BLUE,
            boxShadow: `0 0 35px ${BLUE}`,
          }}
        />
      </div>

      {/* decagon */}
      <div
        className={`absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
          phase >= 3
            ? "scale-100 opacity-100"
            : "scale-50 opacity-0"
        }`}
      >
        <svg
          viewBox="0 0 340 340"
          className="h-full w-full overflow-visible"
        >
          <polygon
            points={decagonPoints
              .map((p) => {
                const x = ((p.x - 50) * 10) + 170;
                const y = ((p.y - 50) * 10) + 170;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke={BLUE}
            strokeWidth="1.5"
          />

          {decagonPoints.map((p, index) => {
            const x = (p.x - 50) * 10 + 170;
            const y = (p.y - 50) * 10 + 170;

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="5"
                fill={index % 2 === 0 ? BLUE : "#000"}
              />
            );
          })}
        </svg>
      </div>

      {/* exact logo */}
      <div
        className={`absolute left-1/2 top-1/2 z-40 h-[110px] w-[125px] -translate-x-1/2 -translate-y-1/2 transition-all duration-[1300ms] ${
          phase >= 4
            ? "scale-100 opacity-100"
            : "scale-90 opacity-0"
        }`}
      >
        {LOGO}
      </div>
    </div>
  );
}

/* ===============================================================
   TOP BAR
================================================================ */

function TopBar() {
  return (
    <header className="sticky top-0 z-[80] h-[78px] border-b border-black/10 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-9">{LOGO}</div>

          <div>
            <div className="text-sm font-black tracking-[-0.02em]">
              ARBYTER OS
            </div>

            <div className="text-[7px] tracking-[0.3em] text-black/35">
              AI GOVERNANCE
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#system"
            className="text-xs text-black/50 transition hover:text-black"
          >
            System
          </a>

          <a
            href="#system"
            className="text-xs text-black/50 transition hover:text-black"
          >
            Governance
          </a>

          <a
            href="mailto:arbyteros@gmail.com"
            className="text-xs text-black/50 transition hover:text-black"
          >
            Contact
          </a>
        </nav>

        <Link
          href="/login"
          className="rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#1300BA]"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}