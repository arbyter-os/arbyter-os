"use client";

import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { RuntimeVisual, Flow } from "@/components/site/VisualSystem";
import { Reveal } from "@/components/site/Reveal";
import { DecisionEngine } from "@/components/site/DecisionEngine";

const capabilities = [
  ["01","DISCOVER","Find agents, services and agent-like systems across the enterprise.","/agent-discovery"],
  ["02","UNDERSTAND","Map identity, capabilities, tools and the context behind an action.","/agent-governance"],
  ["03","ENFORCE","Turn organizational intent into a decision at runtime.","/policy-enforcement"],
  ["04","DECIDE","Allow, block or request human approval before execution.","/runtime-governance"],
];

export default function Home(){
 return <main className="site-page">
  <SiteNav/>
  <section className="page-hero home-hero">
   <div className="hero-signal"><span>RUNTIME GOVERNANCE / ONLINE</span><i/></div>
   <div className="eyebrow">ARBYTER / RUNTIME GOVERNANCE</div>
   <h1>A policy changes.<br/><em>An agent acts.</em><br/>Arbyter decides.</h1>
   <p>Arbyter is the runtime governance layer between organizations and their AI agents. It turns organizational intent into decisions that can be enforced when agents act.</p>
   <div className="hero-actions"><Link href="/demo" className="site-enter">RUN THE DEMO</Link><Link href="/how-it-works" className="text-link">HOW IT WORKS <span>↗</span></Link></div>
   <div className="hero-visual"><RuntimeVisual/></div>
  </section>

  <section className="statement-section"><Reveal><div className="eyebrow">THE PROBLEM</div><h2>AI agents can act.<br/><em>Organizations need to decide how.</em></h2><p>Models are getting better at reasoning and execution. The missing layer is the boundary between what an organization intends and what an agent is allowed to do.</p></Reveal></section>

  <section className="dark-section"><Reveal><div className="eyebrow">THE ARBYTER LOOP</div><h2>From intent<br/><em>to execution.</em></h2><Flow items={["Organization intent","Arbyter","Agent action","Allow / Block / Approve","Audit"]}/></Reveal></section>

  <section className="capability-section"><Reveal><div className="eyebrow">ONE GOVERNANCE LAYER</div><h2>See the workforce.<br/><em>Control the action.</em></h2></Reveal><div className="capability-list">{capabilities.map(([n,t,d,href])=><Reveal key={n}><Link href={href} className="capability-row"><span>{n}</span><strong>{t}</strong><p>{d}</p><b>↗</b></Link></Reveal>)}</div></section>

  <section className="visual-section home-intelligence"><Reveal><div className="hero-visual"><RuntimeVisual mode="command"/></div></Reveal><Reveal className="visual-copy"><div className="eyebrow">INTELLIGENCE</div><h2>Company knowledge should shape the action.</h2><p>Business intent, domain knowledge and policy become context for governed runtime decisions.</p><Link href="/intelligence" className="text-link">EXPLORE INTELLIGENCE <span>↗</span></Link></Reveal></section>

  <section className="editorial-section"><Reveal><div><div className="eyebrow">A REAL DECISION</div><h2>Not another dashboard.<br/><em>A boundary at the moment of action.</em></h2></div></Reveal><Reveal><DecisionEngine/></Reveal></section>

  <section className="final-cta"><Reveal><div className="eyebrow">ARBYTER</div><h2>Intelligence<br/><em>meets governance.</em></h2><Link href="/platform" className="site-enter">EXPLORE PLATFORM</Link></Reveal></section>
 </main>
}
