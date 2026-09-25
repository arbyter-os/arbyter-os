"use client";

import { useMemo, useState } from "react";

type Decision = "IDLE" | "ALLOW" | "BLOCK" | "APPROVAL";

const cases = [
  { id:"PAY-41", action:"Send payment to an unapproved beneficiary.", context:"FINANCE / EXTERNAL DESTINATION", policy:"Payments require an approved beneficiary.", decision:"BLOCK" as const, reason:"Beneficiary is outside the approved payment boundary." },
  { id:"HR-18", action:"Finalize a high-impact employee decision.", context:"PEOPLE / SENSITIVE WORKFLOW", policy:"High-impact HR decisions require human review.", decision:"APPROVAL" as const, reason:"Policy requires a human decision before execution." },
  { id:"OPS-09", action:"Read an approved internal service.", context:"OPERATIONS / INTERNAL SYSTEM", policy:"Authorized agents may read approved operational systems.", decision:"ALLOW" as const, reason:"Identity, capability and destination match the allowed boundary." },
];

export function RuntimeEnforcement() {
  const [selected,setSelected]=useState(0);
  const [decision,setDecision]=useState<Decision>("IDLE");
  const item=cases[selected];
  const nodes=useMemo(()=>[
    ["01","AGENT","REQUEST"],
    ["02","CONTEXT","IDENTITY + TOOL + DESTINATION"],
    ["03","ARBYTER","POLICY EVALUATION"],
    ["04","DECISION",decision==="IDLE"?"AWAITING":decision],
    ["05","AUDIT","EVENT RECORDED"],
  ],[decision]);

  return <section className="runtime-enforcement" aria-label="Interactive runtime enforcement visualization">
    <div className="runtime-enforcement-stage">
      <div className="runtime-enforcement-grid" aria-hidden="true"/>
      <div className="runtime-enforcement-flow">
        {nodes.map(([n,label,sub],i)=><div key={n} className={`runtime-node runtime-node-${i} ${decision!=="IDLE" && i===3?"is-decision":""}`}>
          <span>{n}</span><strong>{label}</strong><small>{sub}</small>
          {i<4 && <i aria-hidden="true"/>}
        </div>)}
      </div>
      <div className={`runtime-verdict runtime-verdict-${decision.toLowerCase()}`}>
        <span>RUNTIME VERDICT</span><strong>{decision}</strong>
        <small>{decision==="IDLE"?"ACTION HAS NOT BEEN EVALUATED":item.reason}</small>
      </div>
    </div>

    <div className="runtime-enforcement-lab">
      <div className="runtime-enforcement-copy">
        <span className="eyebrow">RUNTIME ENFORCEMENT / 06</span>
        <h2>Policy becomes a decision <em>at the moment of action.</em></h2>
        <p>Arbyter evaluates the request before the agent crosses the boundary, using the organization’s rules and the context surrounding the action.</p>
      </div>
      <div className="runtime-enforcement-panel">
        <div className="runtime-enforcement-panel-head"><span>LIVE REQUEST</span><b>{item.id}</b></div>
        <div className="runtime-case-tabs">
          {cases.map((c,i)=><button type="button" className={i===selected?"active":""} onClick={()=>{setSelected(i);setDecision("IDLE")}} key={c.id}>{c.context}</button>)}
        </div>
        <div className="runtime-request-block"><span>ACTION</span><strong>{item.action}</strong></div>
        <div className="runtime-policy-block"><span>GOVERNING RULE</span><p>{item.policy}</p></div>
        <button type="button" className="runtime-evaluate" onClick={()=>setDecision(item.decision)} disabled={decision!=="IDLE"}>{decision==="IDLE"?"EVALUATE BEFORE EXECUTION":"DECISION RECORDED"}</button>
        {decision!=="IDLE" && <div className="runtime-record"><span>AUDIT EVENT / {item.id}</span><strong>{item.decision}</strong><p>{item.reason}</p></div>}
      </div>
    </div>
  </section>
}