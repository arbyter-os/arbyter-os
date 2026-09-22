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
      setTimeout(() => setPhase(4), 5400),
      setTimeout(() => setIntroDone(true), 7000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f8fc] text-black">
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
              Intelligence Meets Governance.
            </p>

            <p className="mx-auto mt-8 max-w-xl text-base leading-7 text-black/55">
              The control layer between your organization and its AI agents.
              Connect them. Understand them. Govern them.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="liquid-glass-interactive rounded-full bg-black px-7 py-3 text-sm font-medium text-white shadow-[0_14px_35px_rgba(0,0,0,.14)] transition hover:bg-[#1300BA]"
              >
                Request a demo
              </Link>

              <a
                href="#system"
                className="liquid-glass liquid-glass-interactive rounded-full px-7 py-3 text-sm font-medium transition"
              >
                Explore Arbyter
              </a>
            </div>
          </div>
        </section>

        {/* =========================================================
            HOOK
        ========================================================== */}
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
            SYSTEM / FORTRESS
        ========================================================== */}
        <section
          id="system"
          className="relative overflow-hidden border-b border-black/10 bg-white"
        >
          <div className="mx-auto max-w-5xl px-6 pb-20 pt-28 text-center md:pt-36">
            <div className="mx-auto mb-8 h-16 w-16">{LOGO}</div>

            <h2 className="text-5xl font-black leading-[0.9] tracking-[-0.055em] md:text-7xl">
              EVERYTHING
              <br />
              UNDER CONTROL.
            </h2>

            <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-black/50 md:text-lg">
              Arbyter becomes the operating layer between your organization
              and its autonomous AI systems. It connects agents, gives them
              identity, observes their behavior, applies organizational rules
              and helps your teams understand what needs attention.
            </p>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-black/35">
              You do not need to watch every agent yourself.
              Arbyter watches the system with you.
            </p>
          </div>

          {/* Fortress stays in normal document flow */}
          <div className="mx-auto w-full max-w-[1400px] px-5 pb-28 md:px-10">
            {/* Roof */}
            <div className="mx-auto w-[280px] md:w-[410px]">
              <div className="liquid-glass liquid-glass-interactive border-2 border-white/70 px-8 py-7 text-center shadow-[0_24px_70px_rgba(19,0,186,.14)]">
                <div className="mx-auto mb-5 h-12 w-12">{LOGO}</div>

                <div className="text-2xl font-black tracking-[-0.04em]">
                  ARBYTER OS
                </div>

                <div
                  className="mt-2 text-[9px] font-bold tracking-[0.35em]"
                  style={{ color: BLUE }}
                >
                  INTELLIGENCE · GOVERNANCE
                </div>

                <p className="mt-5 text-xs leading-5 text-black/45">
                  The intelligence layer between your organization and its
                  autonomous systems.
                </p>
              </div>
            </div>

            {/* Main fortress */}
            <div className="relative mt-20 border-x-2 border-t-2 border-black bg-white px-3 pt-3 md:px-5 md:pt-5">
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
                    className="liquid-glass liquid-glass-interactive group relative flex min-h-[350px] flex-col justify-between overflow-hidden border border-white/70 p-6 text-left transition-all duration-300 hover:bg-white/72"
                  >
                    <div
                      className="absolute left-0 top-0 h-1 w-full"
                      style={{ backgroundColor: BLUE }}
                    />

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

                    <div className="mt-12">
                      <h3 className="text-2xl font-black tracking-[-0.035em] md:text-3xl">
                        {pillar.name}
                      </h3>

                      <p className="mt-5 text-sm leading-6 text-black/50 group-hover:text-white/50">
                        {pillar.description}
                      </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-5 group-hover:border-white/10">
                      <span className="text-[10px] tracking-[0.25em] text-black/35 group-hover:text-white/35">
                        EXPLORE SYSTEM
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

              {/* Command Center */}
              <div className="liquid-glass-dark mt-4 border px-6 py-10 text-white md:px-10">
                <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
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
                    Arbyter does not simply collect logs. It turns agent
                    activity into operational intelligence your organization
                    can understand and act on.
                  </p>
                </div>

                <div className="grid gap-px bg-white/10 md:grid-cols-3">
                  {[
                    {
                      title: "What is happening?",
                      text: "See agent activity, tools, data access, tasks, interactions, decisions, errors and outcomes.",
                    },
                    {
                      title: "Why is it happening?",
                      text: "Understand the context behind behavior, including permissions, policies, decisions and unexpected actions.",
                    },
                    {
                      title: "What should happen next?",
                      text: "Investigate risks, intervene when necessary and guide the system toward the right outcome.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="bg-black p-7">
                      <h4 className="text-xl font-bold">{item.title}</h4>

                      <p className="mt-4 text-sm leading-6 text-white/40">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foundation */}
              <div className="liquid-glass mt-4 border border-white/70">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
                  {[
                    ["AGENTS", "Autonomous systems"],
                    ["IDENTITIES", "Who is acting"],
                    ["TOOLS", "What they can use"],
                    ["DATA", "What they can access"],
                    ["ACTIONS", "What they can do"],
                  ].map(([title, description]) => (
                    <div
                      key={title}
                      className="border-b border-black/10 p-6 md:border-b-0 md:border-r"
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

                <div className="border-t-2 border-black px-6 py-12 text-center">
                  <div className="text-[9px] tracking-[0.35em] text-black/35">
                    FOUNDATION
                  </div>

                  <h3 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    YOUR AI AGENTS
                  </h3>

                  <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-black/45">
                    Every autonomous system becomes visible, identifiable and
                    governable without forcing your organization to rebuild
                    its existing AI infrastructure.
                  </p>
                </div>
              </div>

              <div
                className="mx-auto h-5 w-[104%] -translate-x-[2%]"
                style={{ backgroundColor: BLUE }}
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            SYSTEM ARCHITECTURE
        ========================================================== */}
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
                  Their real impact appears when an organization has
                  <span className="font-semibold text-black">
                    {" "}
                    dozens, hundreds or thousands of them.
                  </span>
                </p>

                <p className="mt-7 text-base leading-7 text-black/40">
                  Different models. Different tools. Different permissions.
                  Different decisions. All operating across the same business.
                  Arbyter creates the common layer that brings them together.
                </p>
              </div>
            </div>

            <div className="mt-24 border-2 border-black">
              {[
                {
                  number: "01",
                  title: "CONNECT",
                  description:
                    "Bring existing AI agents into Arbyter without rebuilding your AI infrastructure.",
                  detail:
                    "Connect agents through supported connection mechanisms and establish the foundation for continuous observation.",
                },
                {
                  number: "02",
                  title: "IDENTIFY",
                  description:
                    "Give every agent a clear identity, owner and operational context.",
                  detail:
                    "Know exactly which system is acting, what environment it belongs to and what responsibilities it has.",
                },
                {
                  number: "03",
                  title: "OBSERVE",
                  description:
                    "Understand what every agent is doing across the organization.",
                  detail:
                    "Monitor activity, tools, data access, decisions, interactions, errors, tasks and outcomes.",
                },
                {
                  number: "04",
                  title: "GOVERN",
                  description:
                    "Apply organizational rules to autonomous behavior.",
                  detail:
                    "Establish policies, permissions, boundaries, approvals and compliance requirements.",
                },
                {
                  number: "05",
                  title: "PROTECT",
                  description:
                    "Detect behavior that could create risk.",
                  detail:
                    "Identify security threats, unauthorized access, harmful actions, policy violations and abnormal behavior.",
                },
                {
                  number: "06",
                  title: "RESPOND",
                  description:
                    "Turn signals into decisions and actions.",
                  detail:
                    "Investigate incidents, intervene when necessary and continuously improve the governance system.",
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

            <div className="mt-16 grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "VISIBILITY",
                  title: "Nothing important stays invisible.",
                  text: "From routine actions to abnormal decisions, Arbyter creates a continuous picture of how your AI infrastructure behaves.",
                },
                {
                  label: "ACCOUNTABILITY",
                  title: "Autonomous does not mean unaccountable.",
                  text: "Every meaningful action can be connected back to an agent, its permissions, policies and operating context.",
                },
                {
                  label: "SCALE",
                  title: "Built for the agent economy.",
                  text: "Start with a handful of agents and grow into an organization where hundreds or thousands of autonomous systems operate together.",
                },
              ].map((item) => (
                <div key={item.label} className="border border-black/15 p-8">
                  <div
                    className="text-[9px] font-bold tracking-[0.3em]"
                    style={{ color: BLUE }}
                  >
                    {item.label}
                  </div>

                  <h3 className="mt-5 text-2xl font-black">
                    {item.title}
                  </h3>

                  <p className="mt-5 text-sm leading-6 text-black/45">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            ARCHITECTURE / DARK SECTION
        ========================================================== */}
        <section className="border-b border-black/10 bg-black py-32 text-white md:py-40">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-16 md:grid-cols-[1fr_1.2fr] md:items-center">
              <div>
                <p
                  className="text-xs tracking-[0.35em]"
                  style={{ color: "#6A5DFF" }}
                >
                  THE CONTROL PLANE
                </p>

                <h2 className="mt-5 text-5xl font-black leading-[0.95] tracking-[-0.05em] md:text-7xl">
                  ONE LAYER.
                  <br />
                  EVERY AGENT.
                </h2>

                <p className="mt-8 max-w-md text-sm leading-7 text-white/40">
                  Arbyter is designed to sit above your agent infrastructure
                  without requiring your organization to replace the systems
                  that already work.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  ["01", "AI AGENTS", "The autonomous systems doing the work."],
                  ["02", "IDENTITIES", "Who each agent is and who owns it."],
                  ["03", "CONNECTIONS", "How each system communicates."],
                  ["04", "ACTIVITY", "What agents actually do."],
                  ["05", "DECISIONS", "What they decide and why."],
                  ["06", "POLICIES", "What they are allowed to do."],
                  ["07", "RISK", "What could go wrong."],
                  ["08", "ORGANIZATION", "The humans and systems responsible."],
                ].map(([number, title, text]) => (
                  <div
                    key={number}
                    className="flex items-center justify-between border-b border-white/10 py-5"
                  >
                    <div className="flex items-center gap-5">
                      <span className="text-xs text-white/30">
                        {number}
                      </span>

                      <div>
                        <div className="font-bold tracking-wide">
                          {title}
                        </div>

                        <div className="mt-1 text-xs text-white/30">
                          {text}
                        </div>
                      </div>
                    </div>

                    <span style={{ color: "#6A5DFF" }}>→</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            LAYER 05 / FINAL CTA
        ========================================================== */}
        <section className="relative overflow-hidden bg-white py-36 md:py-48">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1300BA]/5 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto mb-10 h-16 w-16">{LOGO}</div>

              <p
                className="text-xs font-bold tracking-[0.35em]"
                style={{ color: BLUE }}
              >
                BUILD WITH CONFIDENCE
              </p>

              <h2 className="mt-6 text-5xl font-black leading-[0.88] tracking-[-0.06em] md:text-7xl lg:text-8xl">
                LET YOUR
                <br />
                AGENTS MOVE.
                <br />
                WE&apos;LL WATCH.
              </h2>

              <p className="mx-auto mt-9 max-w-2xl text-base leading-8 text-black/50 md:text-lg">
                Your AI infrastructure should be able to move fast without
                becoming impossible to understand. Arbyter gives your
                organization the visibility, governance and security needed
                to operate confidently in an autonomous world.
              </p>
            </div>

            {/* CTA detail grid */}
            <div className="mx-auto mt-24 grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  number: "01",
                  title: "CONNECT",
                  text: "Bring your existing AI agents into one governed environment.",
                },
                {
                  number: "02",
                  title: "GOVERN",
                  text: "Define how autonomous systems are allowed to operate.",
                },
                {
                  number: "03",
                  title: "SECURE",
                  text: "Detect threats, abnormal behavior and dangerous actions.",
                },
                {
                  number: "04",
                  title: "SCALE",
                  text: "Grow from a few agents to an entire AI workforce.",
                },
              ].map((item) => (
                <div
                  key={item.number}
                  className="border-2 border-black bg-white p-7"
                >
                  <div
                    className="text-[10px] font-bold tracking-[0.3em]"
                    style={{ color: BLUE }}
                  >
                    {item.number}
                  </div>

                  <h3 className="mt-12 text-2xl font-black">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-sm leading-6 text-black/45">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="mx-auto mt-16 max-w-6xl border-2 border-black bg-black p-8 text-white md:p-12">
              <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div
                    className="text-[9px] font-bold tracking-[0.35em]"
                    style={{ color: "#6A5DFF" }}
                  >
                    START A CONVERSATION
                  </div>

                  <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                    Want to understand what Arbyter can do for your
                    organization?
                  </h3>

                  <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45">
                    Tell us about your AI systems, your current challenges and
                    where you want autonomous agents to take your organization.
                    We&apos;ll take it from there.
                  </p>
                </div>

                <a
                  href="mailto:arbyteros@gmail.com"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition hover:bg-[#1300BA] hover:text-white"
                >
                  Contact Us →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            FOOTER
        ========================================================== */}
        <footer className="border-t border-black/10 bg-white px-6 py-14">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 md:grid-cols-3">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-10">{LOGO}</div>

                  <div>
                    <div className="text-sm font-black">ARBYTER OS</div>

                    <div className="mt-1 text-[7px] tracking-[0.3em] text-black/35">
                      AI GOVERNANCE INFRASTRUCTURE
                    </div>
                  </div>
                </div>

                <p className="mt-6 max-w-sm text-sm leading-6 text-black/40">
                  The operating layer for organizations building with
                  autonomous AI.
                </p>
              </div>

              {/* Contact */}
              <div>
                <div className="text-[9px] font-bold tracking-[0.3em] text-black/35">
                  CONTACT
                </div>

                <a
                  href="mailto:arbyteros@gmail.com"
                  className="mt-5 block text-sm font-medium transition hover:text-[#1300BA]"
                >
                  arbyteros@gmail.com
                </a>

                <a
                  href="mailto:arbyteros@gmail.com"
                  className="mt-5 inline-flex rounded-full border border-black px-5 py-2.5 text-xs font-semibold transition hover:bg-black hover:text-white"
                >
                  Contact Us →
                </a>
              </div>

              {/* Instagram */}
              <div>
                <div className="text-[9px] font-bold tracking-[0.3em] text-black/35">
                  FOLLOW ARBYTER
                </div>

                <a
                  href="https://www.instagram.com/arbyter.os"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-3 text-sm font-medium transition hover:text-[#1300BA]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-black">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="5"
                        stroke="currentColor"
                        strokeWidth="2"
                      />

                      <circle
                        cx="12"
                        cy="12"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="2"
                      />

                      <circle
                        cx="17.5"
                        cy="6.5"
                        r="1"
                        fill="currentColor"
                      />
                    </svg>
                  </span>

                  @arbyter.os
                </a>
              </div>
            </div>

            <div className="mt-14 flex flex-col gap-4 border-t border-black/10 pt-7 text-[10px] text-black/30 md:flex-row md:items-center md:justify-between">
              <span>© {new Date().getFullYear()} Arbyter OS</span>

              <span>INTELLIGENCE · GOVERNANCE</span>
            </div>
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
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto modal-surface border-2 border-white/70 p-8 shadow-[12px_12px_0_#1300BA] md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePillar(null)}
              className="absolute right-5 top-5 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>

            <div
              className="text-xs font-bold tracking-[0.3em]"
              style={{ color: BLUE }}
            >
              0{activePillar + 1} · {pillars[activePillar].short}
            </div>

            <h3 className="mt-5 text-4xl font-black tracking-[-0.04em] md:text-5xl">
              {pillars[activePillar].name}
            </h3>

            <p className="mt-7 text-lg leading-8 text-black/55">
              {pillars[activePillar].description}
            </p>

            <div className="mt-8 border-t border-black/10 pt-8">
              <div
                className="text-[9px] font-bold tracking-[0.3em]"
                style={{ color: BLUE }}
              >
                HOW ARBYTER HELPS
              </div>

              <p className="mt-5 text-base leading-8 text-black/60">
                {pillars[activePillar].detail}
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {[
                "Continuous visibility",
                "Operational context",
                "Policy awareness",
                "Actionable intelligence",
              ].map((item) => (
                <div
                  key={item}
                  className="border border-black/10 p-4 text-sm font-medium"
                >
                  <span style={{ color: BLUE }}>✓</span>
                  <span className="ml-3">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-black/10 pt-6">
              <div className="text-xs text-black/35">
                ARBYTER OS
              </div>

              <div className="mt-2 text-sm font-semibold">
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
  const unfolded = phase >= 4;
  const logoVisible = phase >= 4;

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden bg-white">
      {/* The intro is intentionally reduced to only the glass unfold and logo. */}
      <div
        className={`absolute inset-0 transition-[filter] duration-[900ms] ease-out ${
          unfolded ? "blur-none" : "blur-[7px]"
        }`}
      >
        {/* Exact Arbyter logo as a 3D glass object */}
        <div
          className={`absolute left-1/2 top-1/2 z-40 h-[150px] w-[168px] -translate-x-1/2 -translate-y-1/2 perspective-[1200px] transition-all duration-[1500ms] ease-[cubic-bezier(.16,1,.3,1)] ${
            logoVisible
              ? "scale-100 rotate-x-0 rotate-y-0 opacity-100"
              : "scale-[.72] rotate-x-[18deg] rotate-y-[-24deg] opacity-0"
          }`}
          style={{
            transformStyle: "preserve-3d",
            filter: logoVisible
              ? "drop-shadow(0 26px 32px rgba(0,0,0,.16)) drop-shadow(0 0 32px rgba(19,0,186,.16))"
              : "none",
          }}
        >
          {[16, 12, 8, 4].map((depth) => (
            <div
              key={depth}
              className="absolute inset-0"
              style={{
                transform: `translate3d(${depth / 4}px,${depth / 4}px,-${depth}px)`,
                opacity: 0.09,
              }}
            >
              {LOGO}
            </div>
          ))}

          <div
            className="absolute inset-0"
            style={{
              opacity: 0.72,
              filter:
                "drop-shadow(0 1px 0 rgba(255,255,255,.95)) drop-shadow(0 8px 14px rgba(0,0,0,.12))",
            }}
          >
            {LOGO}
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[16%] top-[8%] h-[18%] w-[68%] rotate-[-18deg] rounded-full bg-white/55 blur-md"
            style={{ transform: "translateZ(22px)" }}
          />

        </div>
      </div>

      {/* Glass panels unfold around the logo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-50 w-1/2 border-r border-white/80 bg-white/45 shadow-[12px_0_60px_rgba(19,0,186,.08)] backdrop-blur-[18px] transition-transform duration-[1400ms] ease-[cubic-bezier(.77,0,.18,1)]"
        style={{
          transform: unfolded ? "translateX(-100%)" : "translateX(0)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-50 w-1/2 border-l border-white/80 bg-white/45 shadow-[-12px_0_60px_rgba(19,0,186,.08)] backdrop-blur-[18px] transition-transform duration-[1400ms] ease-[cubic-bezier(.77,0,.18,1)]"
        style={{
          transform: unfolded ? "translateX(100%)" : "translateX(0)",
        }}
      />

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 top-0 z-[60] h-full w-px -translate-x-1/2 transition-all duration-[900ms] ${
          unfolded ? "opacity-0" : "opacity-70"
        }`}
        style={{
          background: `linear-gradient(to bottom, transparent, ${BLUE}, transparent)`,
          boxShadow: `0 0 22px ${BLUE}`,
        }}
      />
    </div>
  );
}

/* ===============================================================
   TOP BAR
================================================================ */

function TopBar() {
  return (
    <header className="sticky top-0 z-[80] h-[78px] border-b border-white/70 bg-white/35 shadow-[0_10px_40px_rgba(32,38,75,.08)] backdrop-blur-2xl">
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
            href="mailto:arbyteros@gmail.com"
            className="text-xs text-black/50 transition hover:text-black"
          >
            Contact
          </a>
        </nav>

        <Link
          href="/login"
          className="liquid-glass-interactive rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,.14)] transition hover:bg-[#1300BA]"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}