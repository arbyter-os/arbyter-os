"use client";

import { useState } from "react";
import Link from "next/link";
import Intro from "@/components/intro";

const demoSteps = [
  {
    number: "01",
    title: "Agent",
    text: "A registered AI agent enters the Arbyter control plane.",
  },
  {
    number: "02",
    title: "Task",
    text: "The agent receives a defined task with boundaries and context.",
  },
  {
    number: "03",
    title: "Governance",
    text: "Arbyter evaluates permissions, policies, risk, and compliance.",
  },
  {
    number: "04",
    title: "Approval",
    text: "High-risk actions can pause and request human approval.",
  },
  {
    number: "05",
    title: "Execution",
    text: "Only authorized actions reach the connected systems.",
  },
  {
    number: "06",
    title: "Audit",
    text: "Every important decision and action becomes traceable evidence.",
  },
];

export default function HomePage() {
  const [introDone, setIntroDone] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  return (
    <>
      {!introDone && <Intro onComplete={() => setIntroDone(true)} />}

      <main className="min-h-screen bg-white text-black">
        {/* Navigation */}
        <nav className="fixed left-0 right-0 top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center">
                <span className="text-[29px] font-black leading-none tracking-[-0.12em]">
                  A
                </span>
                <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-[#1677ff]" />
              </div>

              <span className="text-sm font-semibold tracking-[0.22em]">
                ARBYTER
              </span>
            </Link>

            <div className="hidden items-center gap-8 text-sm text-neutral-500 md:flex">
              <a href="#platform" className="transition hover:text-black">
                Platform
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
              className="rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white transition hover:bg-neutral-800"
            >
              Talk to us
            </a>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-28 pt-40 lg:px-10 lg:pb-36 lg:pt-48">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(#d4d4d4 0.7px, transparent 0.7px)",
                backgroundSize: "28px 28px",
              }}
            />
          </div>

          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <div className="mb-7 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-neutral-400">
                <span className="h-2 w-2 rounded-full bg-[#1677ff]" />
                AI control plane
              </div>

              <h1 className="text-6xl font-semibold tracking-[-0.065em] sm:text-7xl lg:text-[104px] lg:leading-[0.92]">
                AI,
                <br />
                <span className="text-neutral-300">under control.</span>
              </h1>

              <p className="mt-9 max-w-2xl text-lg leading-8 text-neutral-500 sm:text-xl">
                Arbyter gives companies a control plane for AI agents —
                governing what agents can access, what they can do, what
                requires approval, and why.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#demo"
                  className="rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  See how it works
                </a>

                <a
                  href="mailto:hello@arbyter.ai"
                  className="rounded-full border border-black/10 px-7 py-3.5 text-sm font-medium transition hover:bg-neutral-50"
                >
                  Request a conversation
                </a>
              </div>
            </div>

            {/* Hero control plane visual */}
            <div className="relative mt-24 h-[390px] overflow-hidden rounded-[32px] border border-black/10 bg-[#fafafa] lg:mt-32">
              <div className="absolute left-1/2 top-1/2 h-px w-[72%] -translate-x-1/2 bg-black/10" />
              <div className="absolute left-1/2 top-1/2 h-[72%] w-px -translate-y-1/2 bg-black/10" />

              <div className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black bg-white shadow-[0_20px_70px_rgba(0,0,0,0.08)]">
                <div className="text-center">
                  <div className="relative mx-auto flex h-10 w-10 items-center justify-center">
                    <span className="text-4xl font-black tracking-[-0.12em]">
                      A
                    </span>
                    <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#1677ff]" />
                  </div>
                  <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.3em]">
                    Arbyter
                  </div>
                </div>
              </div>

              {[
                ["Agents", "left-[8%] top-[18%]"],
                ["Tools", "right-[10%] top-[18%]"],
                ["Data", "left-[10%] bottom-[18%]"],
                ["Systems", "right-[8%] bottom-[18%]"],
              ].map(([label, position]) => (
                <div
                  key={label}
                  className={`absolute ${position} flex items-center gap-3`}
                >
                  <span className="h-2 w-2 rounded-full bg-[#1677ff]" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                    {label}
                  </span>
                </div>
              ))}

              <div className="absolute left-1/2 top-[10%] -translate-x-1/2 text-[9px] font-medium uppercase tracking-[0.35em] text-neutral-300">
                Control
              </div>
            </div>
          </div>
        </section>

        {/* Thesis */}
        <section className="border-t border-black/10 px-6 py-28 lg:px-10 lg:py-40">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
                The shift
              </span>
            </div>

            <div>
              <h2 className="max-w-4xl text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                AI is moving from answering questions to taking actions.
              </h2>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-500">
                Agents can now access tools, move data, make decisions and
                execute workflows. The challenge is no longer simply making
                agents capable.
              </p>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-500">
                It is making them controllable.
              </p>
            </div>
          </div>
        </section>

        {/* Platform */}
        <section
          id="platform"
          className="bg-[#fafafa] px-6 py-28 lg:px-10 lg:py-40"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
                One control plane
              </span>

              <h2 className="mt-6 text-4xl font-medium tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Every agent.
                <br />
                Every action.
                <br />
                One layer of control.
              </h2>
            </div>

            <div className="mt-20 grid gap-px overflow-hidden rounded-[28px] border border-black/10 bg-black/10 md:grid-cols-3">
              {[
                {
                  title: "Visibility",
                  text: "Know what agents are doing, what they accessed, what they decided and where they failed.",
                },
                {
                  title: "Governance",
                  text: "Define boundaries, permissions, policies and approval requirements before actions happen.",
                },
                {
                  title: "Control",
                  text: "Allow, block, flag, pause or require human approval for consequential actions.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-white p-8 lg:p-10">
                  <div className="mb-12 h-2 w-2 rounded-full bg-[#1677ff]" />
                  <h3 className="text-xl font-medium">{item.title}</h3>
                  <p className="mt-4 leading-7 text-neutral-500">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Governance */}
        <section
          id="governance"
          className="px-6 py-28 lg:px-10 lg:py-40"
        >
          <div className="mx-auto grid max-w-7xl gap-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
                Governance
              </span>

              <h2 className="mt-6 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">
                Decisions happen before actions.
              </h2>

              <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-500">
                Arbyter evaluates an agent&apos;s intended action against
                permissions, policies, risk and compliance before execution.
              </p>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-[#fafafa] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.05)]">
              <div className="rounded-2xl border border-black/10 bg-white p-6">
                <div className="flex items-center justify-between border-b border-black/10 pb-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                      Governance decision
                    </div>
                    <div className="mt-2 text-lg font-medium">
                      Financial transfer
                    </div>
                  </div>

                  <span className="rounded-full bg-[#fff4e5] px-3 py-1.5 text-xs font-medium text-[#a15c00]">
                    Review required
                  </span>
                </div>

                <div className="space-y-5 pt-6 text-sm">
                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-400">Agent</span>
                    <span className="font-medium">Finance Agent</span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-400">Action</span>
                    <span className="font-medium">finance.transfer</span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-400">Risk</span>
                    <span className="font-medium">High</span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-400">Policy</span>
                    <span className="font-medium">
                      Human approval required
                    </span>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <button className="rounded-xl bg-black py-3 text-sm font-medium text-white">
                    Approve
                  </button>
                  <button className="rounded-xl border border-black/10 py-3 text-sm font-medium">
                    Block
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section
          id="compliance"
          className="bg-black px-6 py-28 text-white lg:px-10 lg:py-40"
        >
          <div className="mx-auto max-w-7xl">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">
              Compliance
            </span>

            <h2 className="mt-6 max-w-4xl text-4xl font-medium tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Turn regulations into controls.
            </h2>

            <div className="mt-20 grid gap-4 md:grid-cols-4">
              {[
                "Regulation",
                "Requirement",
                "Control",
                "Agent action",
              ].map((item, index) => (
                <div
                  key={item}
                  className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-7"
                >
                  <div className="text-[10px] uppercase tracking-[0.3em] text-white/35">
                    0{index + 1}
                  </div>

                  <div className="mt-12 text-lg font-medium">{item}</div>

                  {index < 3 && (
                    <div className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-r border-t border-white/20 bg-black md:block" />
                  )}
                </div>
              ))}
            </div>

            <p className="mt-10 max-w-2xl text-lg leading-8 text-white/45">
              Connect regulatory requirements to machine-checkable governance
              rules, agent actions and audit evidence.
            </p>
          </div>
        </section>

        {/* Interactive demo */}
        <section id="demo" className="px-6 py-28 lg:px-10 lg:py-40">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
                See it in action
              </span>

              <h2 className="mt-6 text-4xl font-medium tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                From intention to execution.
                <br />
                Under control.
              </h2>
            </div>

            <div className="mt-16 overflow-hidden rounded-[30px] border border-black/10 bg-[#fafafa]">
              <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
                <div className="border-b border-black/10 p-5 lg:border-b-0 lg:border-r">
                  {demoSteps.map((step, index) => (
                    <button
                      key={step.number}
                      onClick={() => setActiveStep(index)}
                      className={`flex w-full items-center gap-4 rounded-xl p-4 text-left transition ${
                        activeStep === index
                          ? "bg-black text-white"
                          : "hover:bg-black/[0.04]"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-medium ${
                          activeStep === index
                            ? "text-white/40"
                            : "text-neutral-400"
                        }`}
                      >
                        {step.number}
                      </span>

                      <span className="text-sm font-medium">{step.title}</span>

                      {activeStep === index && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#1677ff]" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="min-h-[350px] p-8 lg:p-12">
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-neutral-400">
                    <span className="h-2 w-2 rounded-full bg-[#1677ff]" />
                    Step {demoSteps[activeStep].number}
                  </div>

                  <h3 className="mt-7 text-3xl font-medium tracking-[-0.035em]">
                    {demoSteps[activeStep].title}
                  </h3>

                  <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-500">
                    {demoSteps[activeStep].text}
                  </p>

                  <div className="mt-12 rounded-2xl border border-black/10 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400">
                        Arbyter control plane
                      </span>

                      <span className="flex items-center gap-2 text-xs font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1677ff]" />
                        Active
                      </span>
                    </div>

                    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-black transition-all duration-500"
                        style={{
                          width: `${((activeStep + 1) / demoSteps.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setActiveStep((activeStep + 1) % demoSteps.length)
                    }
                    className="mt-7 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                  >
                    Next step →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Human approval */}
        <section className="bg-[#f5f5f5] px-6 py-28 lg:px-10 lg:py-40">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
                Human control
              </span>

              <h2 className="mt-6 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">
                Autonomy where it is safe.
                <br />
                Humans where it matters.
              </h2>

              <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-500">
                High-impact actions can stop at the boundary and wait for a
                human decision before the agent continues.
              </p>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-white p-7">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1677ff]" />
                <span className="text-sm font-medium">
                  Approval required
                </span>
              </div>

              <div className="mt-8 border-t border-black/10 pt-7">
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                  Agent wants to
                </div>

                <div className="mt-3 text-2xl font-medium tracking-[-0.03em]">
                  Transfer ₹250,000
                </div>

                <p className="mt-3 text-sm leading-6 text-neutral-500">
                  This action exceeds the organization&apos;s autonomous
                  execution threshold.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <button className="rounded-xl bg-black py-3 text-sm font-medium text-white">
                  Approve
                </button>
                <button className="rounded-xl border border-black/10 py-3 text-sm font-medium">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Audit */}
        <section className="px-6 py-28 lg:px-10 lg:py-40">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
                  Evidence
                </span>

                <h2 className="mt-6 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">
                  Every consequential action leaves a trail.
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  ["Agent", "Finance Agent"],
                  ["Task", "Process vendor payment"],
                  ["Decision", "REQUIRE_APPROVAL"],
                  ["Policy", "Financial actions above threshold"],
                  ["Approval", "Approved by administrator"],
                  ["Execution", "Completed"],
                ].map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-8 border-b border-black/10 py-5"
                  >
                    <span className="text-sm text-neutral-400">{key}</span>
                    <span className="text-right text-sm font-medium">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Scale */}
        <section className="border-y border-black/10 bg-[#fafafa] px-6 py-28 lg:px-10 lg:py-36">
          <div className="mx-auto max-w-7xl text-center">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
              Built for scale
            </span>

            <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-medium tracking-[-0.045em] sm:text-5xl lg:text-7xl">
              From three agents
              <br />
              to thousands.
            </h2>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-neutral-500">
              One governance layer across your agents, tasks, tools, systems,
              environments and decisions.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-32 lg:px-10 lg:py-48">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-5xl font-medium tracking-[-0.055em] sm:text-6xl lg:text-8xl lg:leading-[0.95]">
              Your agents are already making decisions.
            </h2>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-neutral-500 sm:text-xl">
              Give those decisions a control plane.
            </p>

            <a
              href="mailto:hello@arbyter.ai"
              className="mt-10 inline-flex rounded-full bg-black px-8 py-4 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Talk to Arbyter
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-black/10 px-6 py-10 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-xs text-neutral-400 sm:flex-row">
            <div>© 2026 Arbyter OS</div>
            <div className="uppercase tracking-[0.2em]">
              Orchestrate · Govern · Secure
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}