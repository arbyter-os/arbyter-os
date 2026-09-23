"use client";
import { useState } from "react";
import { SiteNav } from "@/components/site/SiteNav";
import { RuntimeVisual } from "@/components/site/VisualSystem";

export default function Demo(){const [blocked,setBlocked]=useState(false); return <main className="site-page"><SiteNav/><section className="page-hero"><div className="eyebrow">INTERACTIVE DEMO / 11</div><h1>See the decision<br/><em>before the outcome.</em></h1><p>Issue an agent action. Change the policy. Watch the governance layer decide what happens next.</p></section><section className="demo-stage"><RuntimeVisual mode="policy"/><div className="demo-console"><div className="console-top"><span>AGENT / FINANCE-07</span><span className={blocked?"status-bad":"status-good"}>{blocked?"BLOCKED":"READY"}</span></div><div className="console-action">Export customer records to an external destination.</div><div className="console-rule">POLICY / Customer data cannot leave approved systems.</div><button onClick={()=>setBlocked(!blocked)}>{blocked?"RESET ACTION":"RUN ACTION"}</button><div className="console-result">{blocked?"ARBYTER INTERCEPTED THE ACTION":"ACTION IS WAITING FOR RUNTIME EVALUATION"}</div></div></section></main>}
