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
    HOOK — BEFORE THE SYSTEM
========================================================= */}
<section className="relative overflow-hidden border-b border-black/10 bg-white py-32 md:py-44">
  <div className="mx-auto max-w-5xl px-6 text-center">
    <div
      className="mx-auto mb-8 h-2 w-2 rounded-full"
      style={{ backgroundColor: BLUE }}
    />

    <h2 className="text-5xl font-black leading-[0.92] tracking-[-0.06em] md:text-7xl lg:text-8xl">
      YOU SHOULDN&apos;T HAVE TO
      <br />
      WORRY ABOUT YOUR AGENTS.
    </h2>

    <p className="mx-auto mt-10 max-w-2xl text-lg leading-8 text-black/50 md:text-xl">
      They can act. They can decide. They can use tools, access data,
      communicate with systems and operate at scale.
      <br />
      <span className="font-semibold text-black">
        Arbyter makes sure you always know what happens next.
      </span>
    </p>

    <div className="mx-auto mt-14 flex max-w-xl items-center justify-center gap-4">
      <div className="h-px flex-1 bg-black/10" />
      <div
        className="text-[10px] font-bold tracking-[0.35em]"
        style={{ color: BLUE }}
      >
        LET THEM MOVE
      </div>
      <div className="h-px flex-1 bg-black/10" />
    </div>
  </div>
</section>

{/* =========================================================
    LAYER 02 — THE ARBYTER SYSTEM
========================================================= */}
<section
  id="system"
  className="relative overflow-hidden border-b border-black/10 bg-white"
>
  {/* Intro */}
  <div
    className="mx-auto px-6 text-center"
    style={{
      paddingTop: "120px",
      paddingBottom: "70px",
    }}
  >
    <div className="mx-auto mb-8 h-16 w-16">
      {LOGO}
    </div>

    <h2 className="text-5xl font-black leading-[0.9] tracking-[-0.055em] md:text-7xl">
      EVERYTHING
      <br />
      UNDER CONTROL.
    </h2>

    <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-black/50 md:text-lg md:leading-8">
      Arbyter turns a growing network of autonomous agents into an
      observable, governed and secure system. Every agent becomes part
      of one operating environment — with clear boundaries, continuous
      visibility and mechanisms to intervene when something goes wrong.
    </p>
  </div>

  {/* Fortress */}
  <div className="relative mx-auto min-h-[1500px] max-w-[1400px] px-5 md:min-h-[1350px] md:px-10">
    {/* subtle architectural grid */}
    <div className="pointer-events-none absolute inset-0 opacity-[0.035]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
    </div>

    {/* Roof */}
    <div className="absolute left-1/2 top-0 z-20 w-[280px] -translate-x-1/2 md:w-[410px]">
      <div className="relative border-2 border-black bg-white px-8 py-7 text-center shadow-[10px_10px_0_#1300BA]">
        <div className="mx-auto mb-5 h-12 w-12">
          {LOGO}
        </div>

        <div className="text-2xl font-black tracking-[-0.04em]">
          ARBYTER OS
        </div>

        <div
          className="mt-2 text-[9px] font-bold tracking-[0.35em]"
          style={{ color: BLUE }}
        >
          ORCHESTRATE · GOVERN · SECURE
        </div>

        <p className="mt-5 text-xs leading-5 text-black/45">
          The intelligence layer between your organization and its
          autonomous systems.
        </p>
      </div>
    </div>

    {/* Main fortress */}
    <div className="absolute left-1/2 top-[245px] w-[96%] -translate-x-1/2 md:w-[91%]">
      {/* Top horizontal structure */}
      <div className="relative border-x-2 border-t-2 border-black bg-white px-3 pt-3 md:px-5 md:pt-5">
        <div
          className="absolute left-0 top-0 h-1 w-full"
          style={{ backgroundColor: BLUE }}
        />

        {/* Pillars */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, index) => (
            <button
              key={pillar.name}
              onClick={() => setActivePillar(index)}
              className="group relative flex min-h-[330px] flex-col justify-between overflow-hidden border-2 border-black bg-white p-6 text-left transition-all duration-300 hover:-translate-y-2 hover:bg-black hover:text-white"
            >
              {/* blue accent */}
              <div
                className="absolute left-0 top-0 h-1 w-full"
                style={{ backgroundColor: BLUE }}
              />

              {/* number */}
              <div className="flex items-start justify-between">
                <span
                  className="text-[10px] font-bold tracking-[0.3em]"
                  style={{ color: BLUE }}
                >
                  0{index + 1}
                </span>

                <span className="text-[10px] text-black/25 group-hover:text-white/25">
                  SYSTEM
                </span>
              </div>

              {/* content */}
              <div className="mt-12">
                <h3 className="text-2xl font-black tracking-[-0.035em] md:text-3xl">
                  {pillar.name}
                </h3>

                <p className="mt-5 text-sm leading-6 text-black/50 group-hover:text-white/50">
                  {pillar.description}
                </p>
              </div>

              {/* bottom */}
              <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-5 group-hover:border-white/10">
                <span className="text-[10px] tracking-[0.25em] text-black/35 group-hover:text-white/35">
                  EXPLORE
                </span>

                <span
                  className="text-xl transition-transform duration-300 group-hover:translate-x-2"
                  style={{ color: BLUE }}
                >
                  →
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Command layer */}
        <div className="mt-4 border-2 border-black bg-black px-6 py-10 text-white md:px-10">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div
                className="text-[9px] font-bold tracking-[0.35em]"
                style={{ color: "#6A5DFF" }}
              >
                COMMAND CENTER
              </div>

              <h3 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                Know what&apos;s happening.
              </h3>
            </div>

            <p className="max-w-md text-sm leading-6 text-white/40">
              Arbyter doesn&apos;t simply collect logs. It turns agent
              activity into operational intelligence that people can act on.
            </p>
          </div>

          <div className="grid gap-px bg-white/10 md:grid-cols-3">
            <div className="bg-black p-7">
              <div className="text-[9px] tracking-[0.3em] text-white/30">
                OBSERVE
              </div>

              <h4 className="mt-5 text-xl font-bold">
                What is happening?
              </h4>

              <p className="mt-4 text-sm leading-6 text-white/40">
                Monitor actions, tools, data access, interactions,
                tasks and system behavior across your agents.
              </p>
            </div>

            <div className="bg-black p-7">
              <div className="text-[9px] tracking-[0.3em] text-white/30">
                UNDERSTAND
              </div>

              <h4 className="mt-5 text-xl font-bold">
                Why is it happening?
              </h4>

              <p className="mt-4 text-sm leading-6 text-white/40">
                Trace decisions, context, permissions, policies,
                failures and unexpected behavior.
              </p>
            </div>

            <div className="bg-black p-7">
              <div className="text-[9px] tracking-[0.3em] text-white/30">
                RESPOND
              </div>

              <h4 className="mt-5 text-xl font-bold">
                What should happen next?
              </h4>

              <p className="mt-4 text-sm leading-6 text-white/40">
                Investigate, intervene, restrict, escalate or allow
                actions based on the organization&apos;s rules.
              </p>
            </div>
          </div>
        </div>

        {/* Foundation */}
        <div className="mt-4 border-2 border-black bg-white">
          <div className="grid grid-cols-2 md:grid-cols-5">
            {[
              ["AGENTS", "Autonomous systems"],
              ["IDENTITIES", "Who is acting"],
              ["TOOLS", "What they can use"],
              ["DATA", "What they can access"],
              ["ACTIONS", "What they can do"],
            ].map(([title, description]) => (
              <div
                key={title}
                className="border-b border-r border-black/10 p-6 last:border-r-0 md:border-b-0"
              >
                <div className="text-[9px] font-bold tracking-[0.25em] text-black/30">
                  {title}
                </div>

                <div className="mt-3 text-sm font-semibold">
                  {description}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-black px-6 py-10 text-center">
            <div className="text-[9px] tracking-[0.35em] text-black/35">
              FOUNDATION
            </div>

            <h3 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              YOUR AI AGENTS
            </h3>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-black/45">
              Every autonomous system becomes visible, identifiable and
              governable without forcing your organization to rebuild its
              existing AI infrastructure.
            </p>
          </div>
        </div>

        {/* Fortress base */}
        <div
          className="mx-auto h-5 w-[104%] -translate-x-[2%]"
          style={{ backgroundColor: BLUE }}
        />
      </div>
    </div>

    {/* Bottom statement */}
    <div className="absolute bottom-[80px] left-1/2 w-full -translate-x-1/2 px-6 text-center md:bottom-[55px]">
      <p className="text-sm tracking-wide text-black/35">
        ONE SYSTEM FOR THE AGENTS YOU HAVE TODAY —
        <span className="font-semibold text-black">
          {" "}AND THE THOUSANDS YOU WILL HAVE TOMORROW.
        </span>
      </p>
    </div>
  </div>
</section>

{/* =========================================================
    LAYER 03 — FROM AGENTS TO ORGANIZATION
========================================================= */}
<section className="relative overflow-hidden border-b border-black/10 bg-white py-36 md:py-48">
  <div className="mx-auto max-w-7xl px-6">
    <div className="grid gap-20 md:grid-cols-2 md:items-end">
      <div>
        <p
          className="text-xs font-bold tracking-[0.35em]"
          style={{ color: BLUE }}
        >
          THE OPERATING LAYER
        </p>

        <h2 className="mt-6 text-5xl font-black leading-[0.88] tracking-[-0.06em] md:text-7xl lg:text-8xl">
          FROM
          <br />
          AGENTS
          <br />
          TO SYSTEM.
        </h2>
      </div>

      <div>
        <p className="text-xl leading-9 text-black/55">
          AI agents are powerful individually.
          <br />
          Their real impact comes when an organization has
          <span className="font-semibold text-black">
            {" "}dozens, hundreds or thousands of them.
          </span>
        </p>

        <p className="mt-7 text-base leading-7 text-black/40">
          That is where complexity becomes the problem. Different agents,
          different models, different tools, different permissions,
          different decisions — operating across the same business.
          Arbyter creates the common layer that brings all of it together.
        </p>
      </div>
    </div>

    {/* Architecture flow */}
    <div className="mt-24 border-2 border-black">
      {[
        {
          number: "01",
          title: "CONNECT",
          description:
            "Bring existing AI agents into Arbyter without rebuilding them.",
          detail:
            "APIs, webhooks, SDKs, MCP and other connection mechanisms.",
        },
        {
          number: "02",
          title: "IDENTIFY",
          description:
            "Give every agent a clear identity, ownership and operational context.",
          detail:
            "Know which agent is acting, who owns it and what environment it belongs to.",
        },
        {
          number: "03",
          title: "OBSERVE",
          description:
            "Understand what every agent is doing in real time.",
          detail:
            "Activity, tools, data, decisions, interactions, errors and outcomes.",
        },
        {
          number: "04",
          title: "GOVERN",
          description:
            "Apply organizational rules to autonomous behavior.",
          detail:
            "Policies, permissions, boundaries, compliance requirements and controls.",
        },
        {
          number: "05",
          title: "PROTECT",
          description:
            "Detect behavior that could create risk for the organization.",
          detail:
            "Security threats, unauthorized access, harmful actions and anomalies.",
        },
        {
          number: "06",
          title: "RESPOND",
          description:
            "Turn signals into decisions and actions.",
          detail:
            "Investigate incidents, intervene when required and continuously improve governance.",
        },
      ].map((item, index) => (
        <div
          key={item.number}
          className={`grid gap-8 border-b border-black/15 p-7 last:border-b-0 md:grid-cols-[90px_1fr_1fr] md:items-center md:p-10 ${
            index % 2 === 0 ? "bg-white" : "bg-black/[0.015]"
          }`}
        >
          <div
            className="text-xs font-bold tracking-[0.3em]"
            style={{ color: BLUE }}
          >
            {item.number}
          </div>

          <div>
            <h3 className="text-2xl font-black tracking-[-0.03em]">
              {item.title}
            </h3>

            <p className="mt-3 max-w-md text-sm leading-6 text-black/50">
              {item.description}
            </p>
          </div>

          <div className="border-l border-black/10 pl-0 md:pl-8">
            <p className="text-sm leading-6 text-black/40">
              {item.detail}
            </p>
          </div>
        </div>
      ))}
    </div>

    {/* Final detail cards */}
    <div className="mt-16 grid gap-4 md:grid-cols-3">
      <div className="border border-black/15 p-8">
        <div
          className="text-[9px] font-bold tracking-[0.3em]"
          style={{ color: BLUE }}
        >
          VISIBILITY
        </div>

        <h3 className="mt-5 text-2xl font-black">
          Nothing important stays invisible.
        </h3>

        <p className="mt-5 text-sm leading-6 text-black/45">
          From routine actions to abnormal decisions, Arbyter creates
          a continuous picture of how your AI infrastructure behaves.
        </p>
      </div>

      <div className="border border-black/15 p-8">
        <div
          className="text-[9px] font-bold tracking-[0.3em]"
          style={{ color: BLUE }}
        >
          ACCOUNTABILITY
        </div>

        <h3 className="mt-5 text-2xl font-black">
          Autonomous does not mean unaccountable.
        </h3>

        <p className="mt-5 text-sm leading-6 text-black/45">
          Every meaningful action can be connected back to an agent,
          its permissions, its policies and its operating context.
        </p>
      </div>

      <div className="border border-black/15 p-8">
        <div
          className="text-[9px] font-bold tracking-[0.3em]"
          style={{ color: BLUE }}
        >
          SCALE
        </div>

        <h3 className="mt-5 text-2xl font-black">
          Built for the agent economy.
        </h3>

        <p className="mt-5 text-sm leading-6 text-black/45">
          Start with a handful of agents and grow into an organization
          where hundreds or thousands of autonomous systems operate
          together.
        </p>
      </div>
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