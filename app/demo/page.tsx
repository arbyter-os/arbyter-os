"use client";

import { useMemo, useState } from "react";
import { SiteNav } from "@/components/site/SiteNav";
import { RuntimeVisual } from "@/components/site/VisualSystem";

type Outcome = "READY" | "ALLOW" | "BLOCK" | "APPROVAL";

type Scenario = {
  id: string;
  agent: string;
  action: string;
  policy: string;
  outcome: Exclude<Outcome, "READY">;
  reason: string;
};

const scenarios: Scenario[] = [
  {
    id: "FIN-07",
    agent: "FINANCE / EXPORT",
    action: "Export customer records to an external destination.",
    policy: "Customer data cannot leave approved systems.",
    outcome: "BLOCK",
    reason: "Destination is outside the approved data boundary.",
  },
  {
    id: "PEO-03",
    agent: "PEOPLE / DECISION",
    action: "Approve a high-impact HR decision.",
    policy: "High-impact HR decisions require human review.",
    outcome: "APPROVAL",
    reason: "The action matches a policy that requires a human decision.",
  },
  {
    id: "OPS-12",
    agent: "OPERATIONS / READ",
    action: "Read an approved internal operational system.",
    policy: "Internal agents may read approved operational systems.",
    outcome: "ALLOW",
    reason: "The agent, capability and destination are inside the allowed boundary.",
  },
];

const timelineFor = (outcome: Exclude<Outcome, "READY">) => [
  ["01", "REQUEST", "Agent requests the action."],
  ["02", "CONTEXT", "Arbyter resolves identity, destination and policy."],
  ["03", "DECISION", outcome === "BLOCK" ? "Action stopped before execution." : outcome === "APPROVAL" ? "Action paused for human review." : "Action permitted inside policy."],
  ["04", "AUDIT", "Decision recorded with the governing rule."],
];

export default function Demo() {
  const [selected, setSelected] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>("READY");
  const [policyVersion, setPolicyVersion] = useState(1);

  const scenario = scenarios[selected];
  const timeline = useMemo(
    () => (outcome === "READY" ? [] : timelineFor(outcome)),
    [outcome],
  );

  function runAction() {
    setOutcome(scenario.outcome);
  }

  function reset() {
    setOutcome("READY");
  }

  function changePolicy() {
    setPolicyVersion((value) => value + 1);
    setOutcome("READY");
  }

  return (
    <main className="site-page demo-page">
      <SiteNav />

      <section className="page-hero demo-hero">
        <div className="eyebrow">INTERACTIVE DEMO / RUNTIME DECISION</div>
        <h1>
          See the decision
          <br />
          <em>before the outcome.</em>
        </h1>
        <p>
          Choose an agent action. Arbyter evaluates the request against organizational policy
          and returns a runtime decision.
        </p>
      </section>

      <section className="demo-lab" aria-label="Arbyter runtime governance simulation">
        <div className="demo-visual">
          <RuntimeVisual mode={outcome === "BLOCK" ? "security" : outcome === "APPROVAL" ? "policy" : "runtime"} />
          <div className="demo-visual-state">
            <span>RUNTIME STATE</span>
            <strong>{outcome === "READY" ? "AWAITING REQUEST" : outcome}</strong>
          </div>
        </div>

        <div className="demo-panel">
          <div className="demo-panel-head">
            <div>
              <span className="demo-kicker">01 / SELECT ACTION</span>
              <h2>What should the agent do?</h2>
            </div>
            <span className="demo-version">POLICY V{policyVersion}.0</span>
          </div>

          <div className="demo-scenarios" role="tablist" aria-label="Demo scenarios">
            {scenarios.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={index === selected ? "is-selected" : ""}
                onClick={() => {
                  setSelected(index);
                  setOutcome("READY");
                }}
                role="tab"
                aria-selected={index === selected}
              >
                <span>0{index + 1}</span>
                <strong>{item.agent}</strong>
              </button>
            ))}
          </div>

          <div className="demo-request">
            <span>AGENT / {scenario.id}</span>
            <strong>{scenario.action}</strong>
          </div>

          <div className="demo-policy">
            <span>GOVERNING POLICY</span>
            <p>{scenario.policy}</p>
          </div>

          <div className="demo-controls">
            <button type="button" className="demo-primary" onClick={runAction} disabled={outcome !== "READY"}>
              {outcome === "READY" ? "EVALUATE ACTION" : "DECISION COMPLETE"}
            </button>
            <button type="button" className="demo-secondary" onClick={changePolicy}>
              CHANGE POLICY
            </button>
            {outcome !== "READY" && (
              <button type="button" className="demo-secondary" onClick={reset}>
                RESET
              </button>
            )}
          </div>

          <div className={`demo-decision demo-decision-${outcome.toLowerCase()}`} aria-live="polite">
            <div className="demo-decision-top">
              <span>ARBYTER DECISION</span>
              <strong>{outcome}</strong>
            </div>
            <p>
              {outcome === "READY"
                ? "The action has not crossed the governance boundary yet."
                : scenario.reason}
            </p>
          </div>
        </div>
      </section>

      {outcome !== "READY" && (
        <section className="demo-audit">
          <div className="demo-audit-heading">
            <span className="demo-kicker">02 / RUNTIME TRACE</span>
            <h2>From request to <em>record.</em></h2>
          </div>
          <div className="demo-timeline">
            {timeline.map(([number, label, body]) => (
              <div className="demo-timeline-item" key={number}>
                <span>{number}</span>
                <div>
                  <strong>{label}</strong>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="demo-audit-record">
            <div>
              <span>AUDIT EVENT</span>
              <strong>{scenario.id} / {scenario.outcome}</strong>
            </div>
            <p>Agent action evaluated against Policy V{policyVersion}.0. Runtime decision persisted as an auditable event.</p>
          </div>
        </section>
      )}
    </main>
  );
}
