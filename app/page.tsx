"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Intro from "@/components/landing/intro";

type Agent = {
  id: string;
  name: string;
  type: string;
  color: string;
  x: number;
  y: number;
};

const agents: Agent[] = [
  { id: "sales", name: "Sales Agent", type: "CRM", color: "#1677ff", x: 13, y: 25 },
  { id: "finance", name: "Finance Agent", type: "Finance", color: "#111111", x: 27, y: 72 },
  { id: "support", name: "Support Agent", type: "Customer", color: "#1677ff", x: 50, y: 19 },
  { id: "research", name: "Research Agent", type: "Knowledge", color: "#111111", x: 72, y: 72 },
  { id: "ops", name: "Operations Agent", type: "Operations", color: "#1677ff", x: 87, y: 27 },
];

const demoStages = [
  {
    label: "Agent",
    eyebrow: "01 / INTENT",
    title: "An agent wants to act.",
    description:
      "The Finance Agent receives a task and decides that a vendor payment should be initiated.",
    detail: "finance.transfer",
  },
  {
    label: "Task",
    eyebrow: "02 / CONTEXT",
    title: "Arbyter understands the action.",
    description:
      "The requested action is connected to the task, agent identity, environment and operating context.",
    detail: "Process vendor payment",
  },
  {
    label: "Governance",
    eyebrow: "03 / CONTROL",
    title: "The action meets the control plane.",
    description:
      "Arbyter evaluates permissions, policies, risk, scope and applicable governance requirements before execution.",
    detail: "Policy evaluation",
  },
  {
    label: "Approval",
    eyebrow: "04 / HUMAN",
    title: "Risk crosses the boundary.",
    description:
      "The action is consequential, so Arbyter pauses execution and asks an authorized human to decide.",
    detail: "REQUIRE_APPROVAL",
  },
  {
    label: "Execution",
    eyebrow: "05 / ACTION",
    title: "Only the authorized action proceeds.",
    description:
      "Once approved, the action travels through the permitted connector to the external system.",
    detail: "Authorized execution",
  },
  {
    label: "Audit",
    eyebrow: "06 / EVIDENCE",
    title: "The decision becomes evidence.",
    description:
      "The action, decision, policy, approval and result are preserved as a traceable record.",
    detail: "Execution audit",
  },
];

const traceItems = [
  ["Agent", "Finance Agent"],
  ["Task", "Process vendor payment"],
  ["Requested action", "finance.transfer"],
  ["Risk", "HIGH"],
  ["Policy", "Financial actions above threshold"],
  ["Decision", "REQUIRE_APPROVAL"],
  ["Approval", "Administrator approved"],
  ["Execution", "Completed"],
];

function Logo({ large = false }: { large?: boolean }) {
  return (
    <Image
      src="/arbyter-os.logo.svg"
      alt="Arbyter OS"
      width={large ? 190 : 132}
      height={large ? 52 : 38}
      priority
      className={large ? "h-12 w-auto" : "h-8 w-auto"}
    />
  );
}

function DotGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.32]"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(0,0,0,.18) 1px, transparent 1px)",
        backgroundSize: "25px 25px",
      }}
    />
  );
}

function SectionLabel({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.32em] ${
        dark ? "text-white/35" : "text-black/35"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          dark ? "bg-[#4d91ff]" : "bg-[#1677ff]"
        }`}
      />
      {children}
    </div>
  );
}

function Connector({
  x1,
  y1,
  x2,
  y2,
  active = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active?: boolean;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <div
      className="absolute origin-left transition-all duration-700"
      style={{
        left: `${x1}%`,
        top: `${y1}%`,
        width: `${length}%`,
        transform: `rotate(${angle}deg)`,
      }}
    >
      <div
        className={`h-px w-full ${
          active ? "bg-[#1677ff]" : "bg-black/[0.09]"
        }`}
      />
      {active && (
        <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#1677ff] shadow-[0_0_18px_rgba(22,119,255,.8)] animate-[flow_2.2s_linear_infinite]" />
      )}
    </div>
  );
}

function NetworkNode({
  agent,
  active,
  onClick,
}: {
  agent: Agent;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
        active ? "scale-110" : "hover:scale-105"
      }`}
      style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full border bg-white shadow-[0_12px_35px_rgba(0,0,0,.08)] transition-all ${
          active ? "border-[#1677ff] shadow-[0_0_35px_rgba(22,119,255,.18)]" : "border-black/10"
        }`}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: agent.color }}
        />
      </div>

      <div className="absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap text-center">
        <div className="text-[11px] font-semibold">{agent.name}</div>
        <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-black/30">
          {agent.type}
        </div>
      </div>
    </button>
  );
}

function ControlPlane({
  activeAgent,
  setActiveAgent,
}: {
  activeAgent: string;
  setActiveAgent: (id: string) => void;
}) {
  const active = agents.find((agent) => agent.id === activeAgent);

  return (
    <div className="relative h-[620px] overflow-hidden rounded-[34px] border border-black/10 bg-[#f7f7f5]">
      <DotGrid />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(22,119,255,.07),transparent_32%)]" />

      <Connector x1={13} y1={25} x2={50} y2={47} active={activeAgent === "sales"} />
      <Connector x1={27} y1={72} x2={50} y2={53} active={activeAgent === "finance"} />
      <Connector x1={50} y1={19} x2={50} y2={46} active={activeAgent === "support"} />
      <Connector x1={72} y1={72} x2={50} y2={53} active={activeAgent === "research"} />
      <Connector x1={87} y1={27} x2={50} y2={47} active={activeAgent === "ops"} />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-black/15 bg-white shadow-[0_35px_100px_rgba(0,0,0,.11)]">
          <div className="absolute inset-4 rounded-full border border-[#1677ff]/15" />
          <div className="absolute inset-9 rounded-full border border-[#1677ff]/10" />

          <div className="relative z-10 text-center">
            <Logo large />
            <div className="mt-3 text-[9px] font-semibold uppercase tracking-[0.32em] text-black/35">
              Control plane
            </div>
          </div>
        </div>
      </div>

      {agents.map((agent) => (
        <NetworkNode
          key={agent.id}
          agent={agent}
          active={activeAgent === agent.id}
          onClick={() => setActiveAgent(agent.id)}
        />
      ))}

      <div className="absolute bottom-6 left-6 right-6 flex flex-col justify-between gap-4 rounded-2xl border border-black/10 bg-white/75 p-4 backdrop-blur-xl sm:flex-row sm:items-center">
        <div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-black/30">
            Selected agent
          </div>
          <div className="mt-1 text-sm font-semibold">
            {active?.name}
          </div>
        </div>

        <div className="flex items-center gap-5 text-[10px] text-black/40">
          <span>Identity verified</span>
          <span>•</span>
          <span>Healthy</span>
          <span>•</span>
          <span className="text-[#1677ff]">Governed</span>
        </div>
      </div>
    </div>
  );
}

function DecisionSimulator() {
  const [decision, setDecision] = useState<"idle" | "blocked" | "approved">(
    "idle"
  );

  return (
    <div className="rounded-[32px] border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_40px_120px_rgba(0,0,0,.35)]">
      <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-[0.28em] text-white/30">
              Live governance simulation
            </div>
            <div className="mt-3 text-xl font-medium">
              Finance Agent
            </div>
          </div>

          <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1677ff]" />
            Live
          </span>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="text-[9px] uppercase tracking-[0.24em] text-white/25">
            Requested action
          </div>

          <div className="mt-3 font-mono text-sm text-white/80">
            finance.transfer
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-3">
              <div className="text-[9px] uppercase tracking-[.2em] text-white/25">
                Permission
              </div>
              <div className="mt-2 text-xs text-[#71a9ff]">Granted</div>
            </div>

            <div className="rounded-xl border border-white/10 p-3">
              <div className="text-[9px] uppercase tracking-[.2em] text-white/25">
                Risk
              </div>
              <div className="mt-2 text-xs text-white">High</div>
            </div>

            <div className="rounded-xl border border-white/10 p-3">
              <div className="text-[9px] uppercase tracking-[.2em] text-white/25">
                Policy
              </div>
              <div className="mt-2 text-xs text-white">Approval</div>
            </div>
          </div>
        </div>

        <div className="my-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[9px] uppercase tracking-[.25em] text-white/25">
            Arbyter decision
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div
          className={`rounded-2xl border p-5 transition-all duration-500 ${
            decision === "blocked"
              ? "border-red-400/30 bg-red-400/[0.06]"
              : decision === "approved"
                ? "border-[#1677ff]/30 bg-[#1677ff]/[0.06]"
                : "border-[#1677ff]/20 bg-[#1677ff]/[0.035]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-[.25em] text-white/25">
                Decision
              </div>

              <div className="mt-2 text-lg font-medium">
                {decision === "blocked"
                  ? "BLOCKED"
                  : decision === "approved"
                    ? "AUTHORIZED"
                    : "REQUIRE_APPROVAL"}
              </div>
            </div>

            <span
              className={`h-2.5 w-2.5 rounded-full ${
                decision === "blocked"
                  ? "bg-red-400"
                  : decision === "approved"
                    ? "bg-[#1677ff]"
                    : "bg-amber-400"
              }`}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setDecision("approved")}
            className="rounded-xl bg-white py-3 text-xs font-semibold text-black transition hover:bg-white/90"
          >
            Approve
          </button>

          <button
            onClick={() => setDecision("blocked")}
            className="rounded-xl border border-white/10 py-3 text-xs font-semibold text-white transition hover:bg-white/5"
          >
            Block
          </button>
        </div>

        {decision !== "idle" && (
          <button
            onClick={() => setDecision("idle")}
            className="mt-4 w-full text-[10px] uppercase tracking-[.2em] text-white/30 transition hover:text-white/60"
          >
            Reset simulation
          </button>
        )}
      </div>
    </div>
  );
}

function ComplianceMap() {
  const nodes = [
    { label: "Regulation", x: 8, y: 50 },
    { label: "Requirement", x: 28, y: 28 },
    { label: "Control", x: 50, y: 50 },
    { label: "Policy", x: 72, y: 28 },
    { label: "Agent action", x: 92, y: 50 },
    { label: "Evidence", x: 72, y: 75 },
    { label: "Audit", x: 50, y: 82 },
  ];

  return (
    <div className="relative h-[500px] overflow-hidden rounded-[32px] border border-black/10 bg-[#fafafa]">
      <DotGrid />

      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <line x1="8%" y1="50%" x2="28%" y2="28%" stroke="rgba(0,0,0,.12)" />
        <line x1="28%" y1="28%" x2="50%" y2="50%" stroke="rgba(0,0,0,.12)" />
        <line x1="50%" y1="50%" x2="72%" y2="28%" stroke="rgba(0,0,0,.12)" />
        <line x1="72%" y1="28%" x2="92%" y2="50%" stroke="#1677ff" strokeOpacity=".35" />
        <line x1="92%" y1="50%" x2="72%" y2="75%" stroke="#1677ff" strokeOpacity=".25" />
        <line x1="72%" y1="75%" x2="50%" y2="82%" stroke="rgba(0,0,0,.12)" />
      </svg>

      {nodes.map((node, index) => (
        <div
          key={node.label}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <div
            className={`flex h-16 min-w-16 items-center justify-center rounded-full border px-4 text-center shadow-sm ${
              index === 2 || index === 4
                ? "border-[#1677ff] bg-white"
                : "border-black/10 bg-white"
            }`}
          >
            <span className="text-[10px] font-semibold whitespace-nowrap">
              {node.label}
            </span>
          </div>

          <div className="mt-3 text-center text-[8px] uppercase tracking-[.2em] text-black/25">
            {String(index + 1).padStart(2, "0")}
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTimeline() {
  return (
    <div className="relative">
      <div className="absolute bottom-0 left-[7px] top-0 w-px bg-black/10" />

      <div className="space-y-7">
        {[
          ["10:42:01", "Agent requested action", "Intent captured"],
          ["10:42:02", "Policy evaluated", "Financial threshold"],
          ["10:42:02", "Risk classified", "HIGH"],
          ["10:42:02", "Approval requested", "Human decision"],
          ["10:43:17", "Approval received", "Administrator"],
          ["10:43:18", "Execution completed", "External system"],
          ["10:43:19", "Evidence recorded", "Audit trail"],
        ].map(([time, title, detail], index) => (
          <div key={time} className="relative flex gap-7">
            <div
              className={`relative z-10 mt-1.5 h-3.5 w-3.5 rounded-full border-4 border-white ${
                index === 2 ? "bg-amber-400" : "bg-[#1677ff]"
              }`}
            />

            <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">{title}</div>
                <div className="mt-1 text-xs text-black/35">{detail}</div>
              </div>

              <div className="font-mono text-[10px] text-black/30">
                {time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [introDone, setIntroDone] = useState(false);
  const [activeAgent, setActiveAgent] = useState("finance");
  const [demoStage, setDemoStage] = useState(0);
  const [agentCount, setAgentCount] = useState(3);
  const [cursor, setCursor] = useState({ x: 50, y: 50 });

  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      if (!heroRef.current) return;

      const rect = heroRef.current.getBoundingClientRect();

      setCursor({
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
      });
    };

    window.addEventListener("pointermove", handlePointer);

    return () => window.removeEventListener("pointermove", handlePointer);
  }, []);

  const simulatedAgents = useMemo(() => {
    const count = Math.min(agentCount, 100);

    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2;
      const radius = 30 + ((index * 7) % 12);

      return {
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
      };
    });
  }, [agentCount]);

  return (
    <>
      {!introDone && <Intro onComplete={() => setIntroDone(true)} />}

      <main className="min-h-screen overflow-hidden bg-white text-black selection:bg-[#1677ff] selection:text-white">
        {/* NAV */}
        <nav className="fixed inset-x-0 top-0 z-50 border-b border-black/[0.06] bg-white/75 backdrop-blur-2xl">
          <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
            <Link href="/" className="flex items-center">
              <Logo />
            </Link>

            <div className="hidden items-center gap-8 text-[11px] font-medium uppercase tracking-[.16em] text-black/45 lg:flex">
              <a href="#problem" className="transition hover:text-black">
                Problem
              </a>
              <a href="#control" className="transition hover:text-black">
                Control
              </a>
              <a href="#governance" className="transition hover:text-black">
                Governance
              </a>
              <a href="#compliance" className="transition hover:text-black">
                Compliance
              </a>
              <a href="#demo" className="transition hover:text-black">
                Demo
              </a>
            </div>

            <a
              href="mailto:hello@arbyter.ai"
              className="rounded-full bg-black px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[.16em] text-white transition hover:bg-[#1677ff]"
            >
              Talk to us
            </a>
          </div>
        </nav>

        {/* HERO / VISUAL HOOK */}
        <section
          ref={heroRef}
          className="relative flex min-h-screen items-center overflow-hidden px-6 pb-24 pt-32 lg:px-10"
        >
          <DotGrid />

          <div
            className="pointer-events-none absolute h-[520px] w-[520px] rounded-full bg-[#1677ff]/[0.07] blur-3xl transition-all duration-700"
            style={{
              left: `${cursor.x}%`,
              top: `${cursor.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          />

          <div className="relative mx-auto w-full max-w-[1440px]">
            <div className="max-w-5xl">
              <SectionLabel>THE AGE OF ACTION-TAKING AI</SectionLabel>

              <h1 className="mt-8 max-w-5xl text-[58px] font-medium leading-[0.92] tracking-[-0.065em] sm:text-7xl lg:text-[112px]">
                AI can act.
                <br />
                <span className="text-black/20">Who controls it?</span>
              </h1>

              <p className="mt-9 max-w-2xl text-lg leading-8 text-black/50 sm:text-xl">
                Agents are gaining access to the systems that run companies.
                They can read data, call tools, make decisions and execute
                actions.
              </p>
            </div>

            {/* Problem visualization */}
            <div className="relative mt-16 h-[430px] overflow-hidden rounded-[32px] border border-black/10 bg-[#f8f8f6] lg:mt-24">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(22,119,255,.05),transparent_35%)]" />

              <div className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-black/15 bg-white shadow-[0_25px_80px_rgba(0,0,0,.1)]">
                  <div className="text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-[.2em]">
                      Your
                    </div>
                    <div className="mt-1 text-lg font-medium">Company</div>
                  </div>
                </div>
              </div>

              {[
                ["CRM", "top-[13%] left-[13%]"],
                ["Email", "top-[25%] right-[12%]"],
                ["Finance", "bottom-[16%] left-[17%]"],
                ["Database", "bottom-[14%] right-[16%]"],
                ["HR", "top-[54%] left-[4%]"],
                ["Cloud", "top-[55%] right-[4%]"],
              ].map(([label, position], index) => (
                <div
                  key={label}
                  className={`absolute ${position} z-10`}
                >
                  <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-2.5 shadow-sm">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        index === 2 || index === 3
                          ? "bg-red-400"
                          : "bg-[#1677ff]"
                      }`}
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-[.18em]">
                      {label}
                    </span>
                  </div>
                </div>
              ))}

              <svg className="absolute inset-0 h-full w-full">
                <line x1="18%" y1="18%" x2="47%" y2="48%" stroke="rgba(0,0,0,.09)" />
                <line x1="82%" y1="29%" x2="53%" y2="48%" stroke="rgba(0,0,0,.09)" />
                <line x1="23%" y1="84%" x2="47%" y2="54%" stroke="rgba(0,0,0,.09)" />
                <line x1="78%" y1="84%" x2="53%" y2="54%" stroke="rgba(0,0,0,.09)" />
                <line x1="6%" y1="59%" x2="44%" y2="51%" stroke="rgba(0,0,0,.09)" />
                <line x1="94%" y1="59%" x2="56%" y2="51%" stroke="rgba(0,0,0,.09)" />
              </svg>

              <div className="absolute bottom-5 left-5 rounded-xl border border-black/10 bg-white/80 px-4 py-3 backdrop-blur-xl">
                <div className="text-[9px] uppercase tracking-[.22em] text-black/30">
                  The problem
                </div>
                <div className="mt-1 text-xs font-medium">
                  Agents are touching everything.
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-3 text-xs text-black/35">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Data
              <span className="ml-4 h-1.5 w-1.5 rounded-full bg-[#1677ff]" />
              Systems
              <span className="ml-4 h-1.5 w-1.5 rounded-full bg-black" />
              Agents
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section
          id="problem"
          className="border-t border-black/10 px-6 py-28 lg:px-10 lg:py-40"
        >
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-20 lg:grid-cols-[.7fr_1.3fr]">
              <div>
                <SectionLabel>The control gap</SectionLabel>
              </div>

              <div>
                <h2 className="max-w-5xl text-4xl font-medium leading-[1.03] tracking-[-.05em] sm:text-5xl lg:text-7xl">
                  The more capable agents become, the harder they become to
                  govern.
                </h2>

                <p className="mt-10 max-w-3xl text-lg leading-8 text-black/45">
                  A company can have one agent today and thousands tomorrow.
                  Each agent can interact with tools, data, APIs, employees,
                  customers and critical systems.
                </p>

                <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["ACCESS", "What can it see?"],
                    ["ACTION", "What can it do?"],
                    ["DECISION", "Why did