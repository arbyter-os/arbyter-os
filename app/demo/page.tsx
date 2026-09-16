"use client";

import Link from "next/link";
import { useState } from "react";

type Stage =
  | "setup"
  | "evaluating"
  | "approval"
  | "executing"
  | "complete"
  | "blocked";

const stages = [
  "Task",
  "Governance",
  "Decision",
  "Approval",
  "Execution",
  "Audit",
];

export default function DemoPage() {
  const [stage, setStage] = useState<Stage>("setup");
  const [decision, setDecision] = useState<"approval" | "blocked" | null>(
    null
  );

  function evaluateTask() {
    setStage("evaluating");

    setTimeout(() => {
      setDecision("approval");
      setStage("approval");
    }, 1100);
  }

  function approveAction() {
    setStage("executing");

    setTimeout(() => {
      setStage("complete");
    }, 1400);
  }

  function blockAction() {
    setDecision("blocked");
    setStage("blocked");
  }

  function resetDemo() {
    setStage("setup");
    setDecision(null);
  }

  const currentIndex =
    stage === "setup"
      ? 0
      : stage === "evaluating"
        ? 1
        : stage === "approval"
          ? 3
          : stage === "executing"
            ? 4
            : stage === "complete"
              ? 5
              : stage === "blocked"
                ? 3
                : 0;

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-[#111]">
      <header className="border-b border-black/[0.07] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/arbyter-os.logo.svg"
              alt="Arbyter OS"
              className="h-8 w-auto"
            />
          </Link>

          <Link
            href="/"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40 transition hover:text-black"
          >
            Back to website
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-6 py-14 lg:px-10 lg:py-20">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/35">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1677ff]" />
            Interactive product demonstration
          </div>

          <h1 className="mt-7 text-5xl font-medium leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-8xl">
            See AI
            <br />
            under control.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-black/45">
            Walk through how Arbyter evaluates an agent action before it
            reaches an external system.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <aside className="rounded-[28px] border border-black/10 bg-white p-6">
            <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-black/30">
              Demo workflow
            </div>

            <div className="mt-7 space-y-2">
              {stages.map((item, index) => (
                <div
                  key={item}
                  className={`flex items-center gap-4 rounded-xl px-4 py-4 transition ${
                    index === currentIndex
                      ? "bg-black text-white"
                      : index < currentIndex
                        ? "bg-[#1677ff]/[0.07] text-[#1677ff]"
                        : "text-black/35"
                  }`}
                >
                  <span className="font-mono text-[10px]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs font-semibold">{item}</span>

                  {index < currentIndex && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-black/10 pt-6">
              <div className="text-[9px] uppercase tracking-[0.2em] text-black/30">
                Environment
              </div>
              <div className="mt-2 text-sm font-medium">Production</div>

              <div className="mt-5 text-[9px] uppercase tracking-[0.2em] text-black/30">
                Agent status
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-[#1677ff]" />
                Healthy · Verified
              </div>
            </div>
          </aside>

          <section className="rounded-[28px] border border-black/10 bg-white p-6 sm:p-10">
            {stage === "setup" && (
              <>
                <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-black/30">
                  Step 01 · Task
                </div>

                <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
                  An agent wants to send a payment.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-black/45">
                  The Finance Agent has received a task to transfer funds to a
                  vendor. Before anything happens, Arbyter captures the intent
                  and evaluates the requested action.
                </p>

                <div className="mt-10 rounded-2xl border border-black/10 bg-[#fafafa] p-5">
                  <div className="text-[9px] uppercase tracking-[0.22em] text-black/30">
                    Agent
                  </div>
                  <div className="mt-2 text-sm font-semibold">
                    Finance Agent
                  </div>

                  <div className="mt-6 text-[9px] uppercase tracking-[0.22em] text-black/30">
                    Requested action
                  </div>
                  <div className="mt-2 font-mono text-sm text-[#1677ff]">
                    finance.transfer
                  </div>

                  <div className="mt-6 text-[9px] uppercase tracking-[0.22em] text-black/30">
                    Amount
                  </div>
                  <div className="mt-2 text-xl font-medium">₹85,000</div>
                </div>

                <button
                  type="button"
                  onClick={evaluateTask}
                  className="mt-8 rounded-full bg-black px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1677ff]"
                >
                  Evaluate action →
                </button>
              </>
            )}

            {stage === "evaluating" && (
              <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#1677ff]/30">
                  <div className="absolute inset-3 animate-ping rounded-full bg-[#1677ff]/10" />
                  <span className="relative h-3 w-3 rounded-full bg-[#1677ff]" />
                </div>

                <div className="mt-8 text-[9px] uppercase tracking-[0.3em] text-black/30">
                  Arbyter is evaluating
                </div>

                <h2 className="mt-4 text-3xl font-medium tracking-[-0.04em]">
                  Checking governance controls…
                </h2>

                <p className="mt-4 max-w-md text-sm leading-7 text-black/40">
                  Reviewing identity, permissions, policy scope, risk and
                  applicable controls.
                </p>
              </div>
            )}

            {stage === "approval" && (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-black/30">
                    Step 04 · Human approval
                  </div>
                  <span className="rounded-full bg-amber-400/15 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-amber-700">
                    Awaiting decision
                  </span>
                </div>

                <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
                  This action needs a human.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-black/45">
                  The policy requires approval for high-value financial
                  transfers. Arbyter pauses execution instead of allowing the
                  agent to proceed automatically.
                </p>

                <div className="mt-10 rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-6">
                  <div className="text-[9px] uppercase tracking-[0.22em] text-amber-700/60">
                    Governance decision
                  </div>

                  <div className="mt-3 font-mono text-xl font-medium text-amber-800">
                    REQUIRE_APPROVAL
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.2em] text-black/30">
                        Risk level
                      </div>
                      <div className="mt-2 text-sm font-semibold">High</div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase tracking-[0.2em] text-black/30">
                        Applied policy
                      </div>
                      <div className="mt-2 text-sm font-semibold">
                        Financial approval threshold
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={approveAction}
                    className="rounded-full bg-black px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1677ff]"
                  >
                    Approve & execute →
                  </button>

                  <button
                    type="button"
                    onClick={blockAction}
                    className="rounded-full border border-black/10 px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] transition hover:border-red-300 hover:text-red-600"
                  >
                    Block action
                  </button>
                </div>
              </>
            )}

            {stage === "executing" && (
              <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#1677ff]/30 bg-[#1677ff]/[0.06]">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-[#1677ff]" />
                </div>

                <div className="mt-8 text-[9px] uppercase tracking-[0.3em] text-black/30">
                  Authorized execution
                </div>

                <h2 className="mt-4 text-3xl font-medium tracking-[-0.04em]">
                  Executing through the permitted connector…
                </h2>

                <p className="mt-4 max-w-md text-sm leading-7 text-black/40">
                  The action is now authorized and being sent to the external
                  financial system.
                </p>
              </div>
            )}

            {stage === "complete" && (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1677ff]/10 text-xl text-[#1677ff]">
                  ✓
                </div>

                <div className="mt-8 text-[9px] font-semibold uppercase tracking-[0.25em] text-black/30">
                  Step 06 · Audit
                </div>

                <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
                  Action completed. Evidence preserved.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-black/45">
                  Arbyter recorded the agent, task, policy, risk, approval,
                  connector, execution and result as one traceable audit
                  chain.
                </p>

                <div className="mt-10 space-y-3">
                  {[
                    ["Decision", "REQUIRE_APPROVAL → APPROVED"],
                    ["Execution", "finance.transfer · Completed"],
                    ["Approval", "Authorized human · Confirmed"],
                    ["Audit", "Evidence recorded"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-col justify-between gap-2 rounded-xl border border-black/10 bg-[#fafafa] p-4 sm:flex-row sm:items-center"
                    >
                      <span className="text-xs text-black/35">{label}</span>
                      <span className="text-xs font-semibold">{value}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={resetDemo}
                  className="mt-8 rounded-full border border-black/10 px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
                >
                  Run again
                </button>
              </>
            )}

            {stage === "blocked" && (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-xl text-red-600">
                  ×
                </div>

                <div className="mt-8 text-[9px] font-semibold uppercase tracking-[0.25em] text-red-600/60">
                  Action blocked
                </div>

                <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
                  Execution stopped by a human.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-black/45">
                  Arbyter prevented the requested action from reaching the
                  external system. The block and its reason are preserved in
                  the audit trail.
                </p>

                <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6">
                  <div className="text-[9px] uppercase tracking-[0.22em] text-red-600/60">
                    Final decision
                  </div>
                  <div className="mt-3 font-mono text-xl font-medium text-red-700">
                    BLOCK
                  </div>
                  <div className="mt-4 text-sm text-red-700/70">
                    Execution was not permitted.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetDemo}
                  className="mt-8 rounded-full border border-black/10 px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
                >
                  Run again
                </button>
              </>
            )}
          </section>
        </div>

        <div className="mt-12 border-t border-black/10 pt-8 text-center text-[10px] uppercase tracking-[0.22em] text-black/30">
          Demonstration environment · No real financial transaction occurs
        </div>
      </div>
    </main>
  );
}