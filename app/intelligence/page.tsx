"use client";

import { useMemo, useState } from "react";
import { SiteNav } from "@/components/site/SiteNav";

const domains = [
  { id: "finance", label: "FINANCE", knowledge: "Approved systems, data boundaries, separation of duties", intent: "Protect financial data while keeping approved automation fast.", rule: "External destinations are blocked unless explicitly approved.", decision: "BLOCK" },
  { id: "people", label: "PEOPLE", knowledge: "Human oversight, sensitive decisions, employee data", intent: "Keep high-impact people decisions under human control.", rule: "High-impact HR decisions require human review.", decision: "APPROVAL" },
  { id: "operations", label: "OPERATIONS", knowledge: "Internal tools, service workflows, operational permissions", intent: "Let agents act freely inside approved operational boundaries.", rule: "Approved operational systems may be read by authorized agents.", decision: "ALLOW" },
];

export default function Intelligence() {
  const [selected, setSelected] = useState(0);
  const [applied, setApplied] = useState(false);
  const domain = domains[selected];

  const nodes = useMemo(() => [
    ["ORGANIZATIONAL KNOWLEDGE", domain.knowledge],
    ["BUSINESS INTENT", domain.intent],
    ["RUNTIME POLICY", domain.rule],
    ["AGENT DECISION", domain.decision],
  ], [domain]);

  return (
    <main className="site-page intelligence-page">
      <SiteNav />
      <section className="page-hero intelligence-hero">
        <div className="eyebrow">INTELLIGENCE / DOMAIN KNOWLEDGE</div>
        <h1>Turn what the company <em>knows</em> into runtime decisions.</h1>
        <p>Arbyter connects organizational knowledge and business intent to the moment an AI agent acts. The result is not another knowledge base. It is context that can shape execution.</p>
      </section>

      <section className="intelligence-system">
        <div className="intelligence-orb" aria-hidden="true"><span>ARBYTER</span><small>INTELLIGENCE</small></div>
        <div className="intelligence-path path-a" />
        <div className="intelligence-path path-b" />
        <div className="intelligence-path path-c" />
        {nodes.map(([label, value], index) => (
          <article className={`intelligence-node node-${index}`} key={label}>
            <span>0{index + 1} / {label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="intelligence-lab">
        <div className="intelligence-lab-copy">
          <div className="eyebrow">KNOWLEDGE → INTENT → POLICY → RUNTIME</div>
          <h2>Same intelligence. Different decisions.</h2>
          <p>Choose a business domain to see how the same governance loop changes with organizational context.</p>
          <div className="intelligence-tabs" role="tablist">
            {domains.map((item, index) => (
              <button key={item.id} type="button" className={index === selected ? "is-active" : ""} onClick={() => { setSelected(index); setApplied(false); }} role="tab" aria-selected={index === selected}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`intelligence-decision intelligence-${domain.decision.toLowerCase()}`}>
          <div className="intelligence-decision-top">
            <span>RUNTIME CONTEXT</span>
            <b>{applied ? domain.decision : "READY"}</b>
          </div>
          <div className="intelligence-decision-row"><span>KNOWLEDGE</span><strong>{domain.knowledge}</strong></div>
          <div className="intelligence-decision-row"><span>INTENT</span><strong>{domain.intent}</strong></div>
          <div className="intelligence-decision-row"><span>POLICY</span><strong>{domain.rule}</strong></div>
          <button type="button" onClick={() => setApplied(true)} disabled={applied}>{applied ? "DECISION APPLIED" : "APPLY TO RUNTIME"}</button>
          <p>{applied ? `Arbyter returned ${domain.decision.toLowerCase()} and recorded the governing context.` : "The action has not crossed the runtime boundary."}</p>
        </div>
      </section>

      <section className="intelligence-loop">
        <div><span className="eyebrow">THE LOOP</span><h2>Knowledge becomes useful when it changes what happens next.</h2></div>
        <div className="intelligence-loop-list">
          <div><b>01</b><strong>Learn</strong><p>Understand company knowledge, constraints and operating context.</p></div>
          <div><b>02</b><strong>Interpret</strong><p>Translate organizational intent into governable requirements.</p></div>
          <div><b>03</b><strong>Enforce</strong><p>Apply those requirements at the runtime boundary.</p></div>
          <div><b>04</b><strong>Record</strong><p>Leave a decision trail showing what context governed the action.</p></div>
        </div>
      </section>
    </main>
  );
}
