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
      "Define the rules, policies and principles that determine how AI agents operate.",
    detail:
      "Governance gives your organization a framework for responsible autonomous behavior. Define organizational policies, ethical requirements, approval rules, regulatory expectations and operating principles. Arbyter helps connect those rules to the agents actually operating inside your organization, so governance becomes something that can be observed and enforced rather than a document sitting on a shelf.",
  },
  {
    name: "Control",
    short: "CTL",
    description:
      "Set boundaries around what agents can access, use and execute.",
    detail:
      "Control determines the practical limits of an AI agent. Define permissions, tool access, environments, authentication requirements, intervention mechanisms and operational boundaries. When an agent moves outside what it was supposed to do, Arbyter provides the visibility and mechanisms needed to investigate or intervene.",
  },
  {
    name: "Visibility",
    short: "VIS",
    description:
      "Understand what your agents are doing, using, deciding and interacting with.",
    detail:
      "Visibility gives teams a continuous picture of autonomous activity. Track actions, tools, data access, interactions, tasks, decisions, failures and outcomes. Instead of asking what an agent has been doing after something goes wrong, teams can see the operating picture as it develops.",
  },
  {
    name: "Audit",
    short: "AUD",
    description:
      "Create a continuous record of agent activity and decisions.",
    detail:
      "Audit creates the evidence layer for your AI systems. Record important actions, decisions, policy events, connection events, failures and interventions. This creates a reliable history that teams can use for internal reviews, incident investigations, accountability and regulatory requirements.",
  },
  {
    name: "Security",
    short: "SEC",
    description:
      "Identify threats, unauthorized behavior and dangerous activity.",
    detail:
      "Security focuses on protecting the organization from AI-related threats. Monitor unauthorized access, suspicious behavior, abnormal activity, unsafe actions, unexpected tool usage and potential security incidents. Arbyter is designed to make security signals visible across the agent environment instead of treating every agent as an isolated system.",
  },
  {
    name: "Compliance",
    short: "CMP",
    description:
      "Connect autonomous behavior with organizational and regulatory requirements.",
    detail:
      "Compliance helps organizations understand whether autonomous systems are operating within the rules that apply to them. Policies can be connected to agent behavior and operational activity, helping teams identify potential violations, review evidence and understand where additional controls may be required.",
  },
  {
    name: "Investigation",
    short: "INV",
    description:
      "Trace incidents from what happened to why it happened.",
    detail:
      "Investigation turns an unexplained event into an understandable chain of activity. Follow an agent's actions, decisions, tools, permissions and interactions to understand what happened, why it happened and what changed. This gives security, operations and leadership teams a common place to investigate incidents.",
  },
  {
    name: "Risk",
    short: "RSK",
    description:
      "Identify business, financial, operational and security risks before they escalate.",
    detail:
      "Risk brings the consequences of autonomous behavior into focus. Identify actions that could create financial exposure, operational disruption, security problems, regulatory issues or reputational damage. Arbyter helps teams prioritize what actually requires attention instead of treating every agent event as equally important.",
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
    <main className="min-h-screen overflow-x-hidden bg-white text-black">
      {!introDone && <Intro phase={phase} />}

      <div
        className={`transition-opacity duration-1000 ${
          introDone ? "opacity-100" : "opacity-0"
        }`}
      >
        <TopBar />

        {/* =========================================================
            HERO
        ========================================================== */}
        <section className="relative flex min-h-[calc(100vh-78px)] items-center justify-center overflow-hidden border-b border-black/10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[8%] top-[20%] h-px w-[84%] bg-black/5" />
            <div className="absolute left-[18%] top-[50%] h-px w-[64%] bg-black/5" />
            <div className="absolute left-[50%] top-0 h-full w-px bg-black/5" />
          </div>

          <div className="relative z-10 max-w-6xl px-6 text-center">
            <div className="mx-auto mb-10 h-20 w-20">
              {LOGO}
            </div>

            <p className="mb-5 text-xs tracking-[0.35em] text-black/50">
              AI GOVERNANCE INFRASTRUCTURE
            </p>

            <h1 className="text-[clamp(3.8rem,10vw,9rem)] font-black leading-[0.82] tracking-[-0.07em]">
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

            {/* HERO ACTIONS */}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#1300BA]"
              >
                Enter Arbyter
              </Link>

              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-7 py-3.5 text-sm font-medium text-black transition hover:border-[#1300BA] hover:text-[#1300BA]"
              >
                Run Demo
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================
            GOVERNANCE
        ========================================================== */}
        <section
          id="governance"
          className="border-b border-black/10 bg-[#f8f9fc] px-6 py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p
                className="text-xs font-medium uppercase tracking-[0.3em]"
                style={{ color: BLUE }}
              >
                THE CONTROL LAYER
              </p>

              <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                AI agents move fast.
                <br />
                Organizations need control.
              </h2>

              <p className="mt-6 text-base leading-7 text-black/55">
                Arbyter sits between your organization and autonomous AI
                systems, giving leadership, security and operations teams a
                common layer for governance, control, visibility, audit,
                security, compliance, investigation and risk.
              </p>
            </div>

            <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {pillars.map((pillar, index) => (
                <button
                  key={pillar.name}
                  onClick={() =>
                    setActivePillar(
                      activePillar === index ? null : index
                    )
                  }
                  className="group rounded-3xl border border-black/10 bg-white p-6 text-left transition hover:-translate-y-1 hover:border-black/20"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold tracking-[0.2em] text-black/35">
                      {pillar.short}
                    </span>

                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: BLUE }}
                    />
                  </div>

                  <h3 className="mt-10 text-xl font-semibold">
                    {pillar.name}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-black/50">
                    {pillar.description}
                  </p>

                  {activePillar === index && (
                    <div className="mt-5 border-t border-black/10 pt-5">
                      <p className="text-sm leading-6 text-black/65">
                        {pillar.detail}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            AGENT ENVIRONMENT
        ========================================================== */}
        <section className="relative overflow-hidden border-b border-black/10 bg-white px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p
                className="text-xs font-medium uppercase tracking-[0.3em]"
                style={{ color: BLUE }}
              >
                AGENT ENVIRONMENT
              </p>

              <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                One control layer.
                <br />
                Every agent.
              </h2>

              <p className="mt-6 text-base leading-7 text-black/55">
                Research, finance, sales, operations, security, support,
                coding, analytics and custom agents can operate across your
                organization while Arbyter provides a unified governance and
                visibility layer.
              </p>
            </div>

            <div className="relative mt-16 h-[420px] overflow-hidden rounded-[2rem] border border-black/10 bg-[#f8f9fc]">
              {agents.map((agent, index) => (
                <div
                  key={index}
                  className="absolute flex items-center justify-center rounded-full border border-black/10 bg-white shadow-sm"
                  style={{
                    left: `${agent.x}%`,
                    top: `${agent.y}%`,
                    width: `${agent.size * 5}px`,
                    height: `${agent.size * 5}px`,
                  }}
                >
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: BLUE }}
                  />
                </div>
              ))}

              <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2rem] border border-black/10 bg-white p-8 shadow-xl">
                {LOGO}
              </div>

              <div className="absolute bottom-5 left-5 rounded-full border border-black/10 bg-white px-4 py-2 text-xs text-black/45">
                Autonomous agent environment
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            VISIBILITY
        ========================================================== */}
        <section className="border-b border-black/10 bg-[#f8f9fc] px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-[0.3em]"
                  style={{ color: BLUE }}
                >
                  VISIBILITY
                </p>

                <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                  See what your agents are actually doing.
                </h2>

                <p className="mt-6 max-w-xl text-base leading-7 text-black/55">
                  Arbyter brings agent activity into one operational picture:
                  tasks, tools, data access, decisions, interactions,
                  failures, risks and outcomes.
                </p>
              </div>

              <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "Tasks",
                    "Decisions",
                    "Tool usage",
                    "Data access",
                    "Interactions",
                    "Failures",
                    "Policy events",
                    "Risk signals",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-black/10 px-5 py-4 text-sm"
                    >
                      <span className="mr-3 inline-block h-1.5 w-1.5 rounded-full bg-[#1300BA]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            COMPLIANCE
        ========================================================== */}
        <section className="border-b border-black/10 bg-white px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-[0.3em]"
                  style={{ color: BLUE }}
                >
                  COMPLIANCE
                </p>

                <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                  Policies become operational.
                </h2>

                <p className="mt-6 max-w-xl text-base leading-7 text-black/55">
                  Organizational policies, regulatory expectations and
                  governance requirements can be connected to the systems
                  actually making autonomous decisions.
                </p>
              </div>

              <div className="rounded-[2rem] border border-black/10 bg-[#f8f9fc] p-8">
                <div className="space-y-4">
                  {[
                    "Financial approval thresholds",
                    "Data access restrictions",
                    "Security requirements",
                    "Operational boundaries",
                    "Regulatory requirements",
                    "Human approval requirements",
                  ].map((rule, index) => (
                    <div
                      key={rule}
                      className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-5 py-4"
                    >
                      <span className="text-sm">{rule}</span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: BLUE }}
                      >
                        RULE 0{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            INVESTIGATION
        ========================================================== */}
        <section className="border-b border-black/10 bg-[#f8f9fc] px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <p
              className="text-xs font-medium uppercase tracking-[0.3em]"
              style={{ color: BLUE }}
            >
              INVESTIGATION
            </p>

            <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              When something goes wrong,
              <br />
              follow the chain.
            </h2>

            <div className="mt-16 grid gap-4 md:grid-cols-5">
              {[
                "Agent",
                "Task",
                "Decision",
                "Tool",
                "Outcome",
              ].map((item, index) => (
                <div
                  key={item}
                  className="relative rounded-3xl border border-black/10 bg-white p-6"
                >
                  <p className="text-xs text-black/35">
                    0{index + 1}
                  </p>

                  <h3 className="mt-10 font-semibold">{item}</h3>

                  {index < 4 && (
                    <div
                      className="absolute right-[-18px] top-1/2 hidden h-px w-9 md:block"
                      style={{ backgroundColor: BLUE }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            CTA
        ========================================================== */}
        <section className="bg-black px-6 py-28 text-white">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-10 h-16 w-16">
              {LOGO}
            </div>

            <h2 className="text-5xl font-black tracking-tight md:text-7xl">
              Autonomous AI needs
              <br />
              an operating layer.
            </h2>

            <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-white/50">
              Arbyter gives organizations the infrastructure to orchestrate,
              govern and secure AI agents at scale.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition hover:bg-[#1300BA] hover:text-white"
              >
                Enter Arbyter
              </Link>

              <Link
                href="/demo"
                className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-white transition hover:border-white/50"
              >
                Run Demo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   INTRO
========================================================= */

function Intro({ phase }: { phase: number }) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#f8f9fc]">
      <div className="absolute inset-0">
        {agents.map((agent, index) => (
          <div
            key={index}
            className={`absolute rounded-full border border-black/10 bg-white shadow-sm transition-all duration-[1800ms] ${
              phase >= 3 ? "scale-0 opacity-0" : "scale-100 opacity-100"
            }`}
            style={{
              left: `${agent.x}%`,
              top: `${agent.y}%`,
              width: `${agent.size * 7}px`,
              height: `${agent.size * 7}px`,
              transform:
                phase >= 2
                  ? "translate(0,0) scale(1.3)"
                  : "translate(0,0) scale(1)",
            }}
          />
        ))}
      </div>

      <div
        className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1300BA] transition-all duration-1000 ${
          phase >= 2 ? "scale-[30] opacity-100" : "scale-0 opacity-0"
        }`}
      />

      <div
        className={`absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
          phase >= 3
            ? "scale-100 rotate-0 opacity-100"
            : "scale-50 rotate-12 opacity-0"
        }`}
      >
        {LOGO}
      </div>

      <div
        className={`absolute inset-x-0 bottom-16 text-center transition-all duration-1000 ${
          phase >= 4 ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
        }`}
      >
        <p className="text-xs tracking-[0.4em] text-black/45">
          ARBYTER OS
        </p>

        <p className="mt-3 text-sm font-medium tracking-[0.25em]">
          ORCHESTRATE. GOVERN. SECURE.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   TOP BAR
========================================================= */

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8">{LOGO}</div>

          <div>
            <div className="text-sm font-bold tracking-tight">
              ARBYTER OS
            </div>

            <div className="text-[9px] uppercase tracking-[0.25em] text-black/35">
              Orchestrate · Govern · Secure
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-xs text-black/50 md:flex">
          <a
            href="#governance"
            className="transition hover:text-black"
          >
            Governance
          </a>

          <a
            href="#governance"
            className="transition hover:text-black"
          >
            Control
          </a>

          <a
            href="#governance"
            className="transition hover:text-black"
          >
            Visibility
          </a>

          <Link
            href="/demo"
            className="font-medium text-black transition hover:text-[#1300BA]"
          >
            Demo
          </Link>
        </nav>

        <Link
          href="/login"
          className="rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#1300BA]"
        >
          Enter Arbyter
        </Link>
      </div>
    </header>
  );
}