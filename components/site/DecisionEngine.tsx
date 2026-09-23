"use client";

import { useMemo, useState } from "react";

const scenarios = [
  { label: "Export customer data", agent: "Finance-07", rule: "Customer data cannot leave approved systems.", result: "BLOCK", reason: "Destination is outside the approved boundary." },
  { label: "Approve a high-impact HR decision", agent: "People-03", rule: "High-impact HR decisions require human review.", result: "APPROVAL", reason: "Human review is required before execution." },
  { label: "Read an approved internal system", agent: "Ops-12", rule: "Internal agents may read approved operational systems.", result: "ALLOW", reason: "Identity, tool and destination match policy." },
];

export function DecisionEngine() {
  const [index, setIndex] = useState(0);
  const scenario = useMemo(() => scenarios[index], [index]);
  return <div className="decision-engine">
    <div className="decision-selector">{scenarios.map((item, i) => <button key={item.label} onClick={() => setIndex(i)} className={i === index ? "selected" : ""}>{item.label}</button>)}</div>
    <div className="decision-body">
      <div className="decision-column"><span>AGENT</span><strong>{scenario.agent}</strong></div>
      <div className="decision-column"><span>REQUEST</span><strong>{scenario.label}</strong></div>
      <div className="decision-rule"><span>POLICY</span><p>{scenario.rule}</p></div>
      <div className={\`decision-outcome outcome-\${scenario.result.toLowerCase()}\`}><span>ARBYTER DECISION</span><strong>{scenario.result}</strong><p>{scenario.reason}</p></div>
    </div>
  </div>;
}
