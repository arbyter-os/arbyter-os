"use client";

import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { RuntimeVisual, Flow } from "@/components/site/VisualSystem";

export default function Home(){
 return <main className="site-page">
  <SiteNav/>
  <section className="page-hero" style={{minHeight:"88vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>
   <div className="eyebrow">ARBYTER / RUNTIME GOVERNANCE</div>
   <h1>A policy changes.<br/><em>An agent acts.</em><br/>Arbyter decides.</h1>
   <p>Arbyter is the runtime governance layer between organizations and their AI agents. It turns organizational intent into decisions that can be enforced when agents act.</p>
   <div style={{display:"flex",gap:12,marginTop:34}}>
    <Link href="/demo" className="site-enter">RUN THE DEMO</Link>
    <Link href="/how-it-works" style={{padding:"11px 18px",fontSize:9,letterSpacing:".18em",textTransform:"uppercase",border:"1px solid rgba(255,255,255,.16)",borderRadius:999,color:"rgba(255,255,255,.65)"}}>HOW IT WORKS</Link>
   </div>
  </section>
  <section className="visual-section">
   <RuntimeVisual/>
   <div className="visual-copy"><div className="eyebrow">THE IDEA</div><h2>The missing layer between intent and execution.</h2><p>Agents can reason, call tools and move through business systems. Arbyter gives the organization a place to define what those actions are allowed to become.</p></div>
  </section>
  <section className="dark-section"><div className="eyebrow">RUNTIME DECISION</div><h2>Not another dashboard.<br/>A boundary at the moment of action.</h2><Flow items={["Organization intent","Arbyter","Agent action","Allow / Block / Approve","Audit"]}/></section>
  <section className="editorial-section"><div><div className="eyebrow">BUILT FOR THE AI WORKFORCE</div><h2>Discover agents. Govern capabilities. Enforce policy.</h2></div><p>Connect agents through MCP, APIs, webhooks, SDKs and internal systems. Build one governance model across the workforce instead of managing every agent as a separate exception.</p></section>
  <section className="page-hero" style={{paddingTop:80,paddingBottom:170}}>
   <div className="eyebrow">ARBYTER</div><h1 style={{fontSize:"clamp(54px,8vw,120px)"}}>Intelligence<br/><em>meets governance.</em></h1>
   <Link href="/platform" className="site-enter" style={{display:"inline-flex",marginTop:35}}>EXPLORE PLATFORM</Link>
  </section>
 </main>
}
