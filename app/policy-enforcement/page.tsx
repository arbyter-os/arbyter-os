"use client";

import { useMemo, useState } from "react";
import { PageFrame } from "@/components/site/PageFrame";

const policies = [
  { id:"HR-18", label:"High-impact HR decisions require human review.", rule:"IF action.category = high-impact-hr THEN decision = APPROVAL", action:"Finalize an employee performance decision", context:"Agent: People Decision · Tool: HR workflow · Sensitivity: high", outcome:"APPROVAL", reason:"The action matches a high-impact HR workflow covered by the policy." },
  { id:"DATA-07", label:"Customer records cannot leave approved systems.", rule:"IF destination.approved = false AND data.class = customer THEN decision = BLOCK", action:"Export customer records to an external destination", context:"Agent: Finance Data · Tool: Export · Destination: unapproved", outcome:"BLOCK", reason:"The destination is outside the organization’s approved boundary." },
  { id:"OPS-09", label:"Approved operational systems may be read by authorized agents.", rule:"IF identity.authorized = true AND system.approved = true THEN decision = ALLOW", action:"Read an approved internal service", context:"Agent: Operations Read · Tool: Internal API · Authorization: verified", outcome:"ALLOW", reason:"The agent identity and target system satisfy the policy conditions." },
] as const;

export default function PolicyEnforcement() {
  const [selected,setSelected]=useState(0), [version,setVersion]=useState(1), [evaluated,setEvaluated]=useState(false), [changed,setChanged]=useState(false);
  const policy=policies[selected];
  const variants = [
    { label:"Authorized HR agents may finalize high-impact decisions.", rule:"IF identity.hr_authorized = true THEN decision = ALLOW", outcome:"ALLOW", reason:"The new policy permits an authorized HR agent to complete the workflow." },
    { label:"External customer-record exports require human approval.", rule:"IF destination.approved = false AND data.class = customer THEN decision = APPROVAL", outcome:"APPROVAL", reason:"The new policy routes an external customer-record export to a human reviewer." },
    { label:"Operational reads require human approval.", rule:"IF action.type = operational-read THEN decision = APPROVAL", outcome:"APPROVAL", reason:"The new policy requires a human checkpoint before operational data is read." },
  ] as const;
  const active = changed ? variants[selected] : policy;
  const audit=useMemo(()=>({id:`evt_${version}_${policy.id.toLowerCase()}`,policy:policy.id,result:active.outcome}),[policy,version,active.outcome]);

  return <PageFrame eyebrow="POLICY ENFORCEMENT / 04" title={<>Words become<br/><em>runtime rules.</em></>} intro="Write the rule in the language your organization already uses. Arbyter turns the intent into an enforceable decision path.">
    <section className="policy-lab" aria-label="Interactive policy enforcement simulation">
      <div className="policy-lab-intro"><span className="eyebrow">LIVE POLICY TRANSLATOR</span><h2>From business language to an action decision.</h2><p>Change the policy, run the action, and inspect the decision path Arbyter records.</p></div>
      <div className="policy-selector" role="tablist" aria-label="Policy scenarios">{policies.map((item,index)=><button key={item.id} type="button" className={index===selected?"active":""} onClick={()=>{setSelected(index);setEvaluated(false);setChanged(false);setVersion(1)}} role="tab" aria-selected={index===selected}><span>{item.id}</span>{item.label}</button>)}</div>
      <div className="policy-pipeline">
        <div className="policy-stage policy-stage-source"><span>01 / POLICY</span><strong>{active.label}</strong><small>Human intent · version {version}</small></div><div className="policy-connector"/>
        <div className="policy-stage policy-stage-rule"><span>02 / RULE</span><strong>{active.rule}</strong><small>Executable condition</small></div><div className="policy-connector"/>
        <div className="policy-stage policy-stage-action"><span>03 / ACTION</span><strong>{policy.action}</strong><small>{policy.context}</small></div><div className="policy-connector"/>
        <div className={`policy-stage policy-stage-decision ${evaluated?"is-evaluated":""} policy-${active.outcome.toLowerCase()}`}><span>04 / DECISION</span><strong>{evaluated?active.outcome:"AWAITING"}</strong><small>{evaluated?active.reason:"Run evaluation at the execution boundary."}</small></div>
      </div>
      <div className="policy-controls"><button type="button" className="policy-evaluate" onClick={()=>setEvaluated(true)}>{evaluated?"RE-EVALUATE ACTION":"EVALUATE ACTION"}</button><button type="button" className="policy-change" onClick={()=>{setVersion(v=>v+1);setChanged(true);setEvaluated(false)}}>{changed?`POLICY CHANGED / V${version}`:`CHANGE POLICY / V${version+1}`</button></div>
      <div className={`policy-audit ${evaluated?"visible":""}`}><div><span>AUDIT EVENT</span><strong>{audit.id}</strong></div><div><span>POLICY</span><strong>{audit.policy} · V{version}</strong></div><div><span>RESULT</span><strong>{evaluated?audit.result:"PENDING"}</strong></div><div><span>TIME</span><strong>runtime / just now</strong></div></div>
    </section>
  </PageFrame>;
}

