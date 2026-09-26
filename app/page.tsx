"use client";

import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";

const capabilities = [
  ["01", "AGENT DISCOVERY", "Find agents across APIs, MCP, SDKs, cloud systems and internal infrastructure."],
  ["02", "POLICY ENFORCEMENT", "Turn business and regulatory intent into controls that run when agents act."],
  ["03", "RUNTIME DECISIONS", "Allow, block, restrict, pause or require human approval before execution."],
  ["04", "AUDITABILITY", "Keep the agent, action, policy, decision and approval context together."],
];

const industries = [
  ["FINANCE", "Control agents touching financial workflows, sensitive data and approvals."],
  ["HR", "Require human review for high-impact employment decisions."],
  ["ENGINEERING", "Govern agents that can change code, infrastructure and production systems."],
  ["CUSTOMER OPERATIONS", "Keep support and operations agents inside approved actions."],
  ["COMPLIANCE", "Translate changing requirements into operational controls."],
  ["ENTERPRISE", "Create one governance layer across many agents and systems."],
];

const events = [
  ["09:41:18", "ALLOW", "Research Agent", "Read approved market dataset"],
  ["09:41:22", "APPROVAL", "HR Agent", "High-impact candidate decision"],
  ["09:41:31", "BLOCK", "Finance Agent", "Attempted restricted transfer"],
  ["09:41:44", "ALLOW", "Support Agent", "Update approved ticket"],
];

export default function Home() {
  return (
    <main className="site-page giga-home">
      <SiteNav />

      <div className="giga-announcement">
        <span>ARBYTER / INTELLIGENCE MEETS GOVERNANCE</span>
        <span>RUNTIME GOVERNANCE FOR AI AGENTS</span>
      </div>

      <section className="giga-hero">
        <div className="giga-kicker">THE GOVERNANCE LAYER FOR THE AI WORKFORCE</div>
        <h1>
          Your AI agents can act.
          <br />
          <i>Govern what they do.</i>
        </h1>
        <p>
          Arbyter sits between your organization and its AI agents, turning
          business and regulatory intent into runtime controls that can allow,
          block or require human approval before an action happens.
        </p>
        <div className="giga-actions">
          <Link href="/demo" className="giga-primary">BOOK YOUR SLOT</Link>
          <Link href="/platform" className="giga-secondary">EXPLORE PLATFORM ↗</Link>
        </div>
      </section>

      <section className="giga-strip">
        <span>DISCOVER</span>
        <span>IDENTIFY</span>
        <span>GOVERN</span>
        <span>DECIDE</span>
        <span>AUDIT</span>
        <span>IMPROVE</span>
      </section>

      <section className="giga-console-section">
        <div className="giga-section-intro">
          <div className="giga-kicker">THE ARBYTER CONTROL PLANE</div>
          <h2>See the AI workforce.<br /><i>Control the action.</i></h2>
          <p>
            A governance console for discovering agents, defining policy,
            reviewing decisions and investigating what happened across the
            organization.
          </p>
        </div>

        <div className="giga-console">
          <aside className="giga-sidebar">
            <div className="giga-console-logo">ARBYTER<span>/OS</span></div>
            {["Overview", "Agents", "Discovery", "Policies", "Controls", "Approvals", "Audit"].map((item, i) => (
              <div className={i === 0 ? "giga-nav-row active" : "giga-nav-row"} key={item}>
                <span>0{i + 1}</span>{item}
              </div>
            ))}
            <div className="giga-sidebar-foot">RUNTIME GOVERNANCE<br /><b>ACTIVE</b></div>
          </aside>

          <div className="giga-console-main">
            <div className="giga-console-head">
              <div>
                <small>ORGANIZATION / CONTROL PLANE</small>
                <h3>Governance Overview</h3>
              </div>
              <span className="giga-live">● SURVEILLANCE ACTIVE</span>
            </div>

            <div className="giga-stats">
              {[
                ["AGENTS", "128", "discovered"],
                ["POLICIES", "42", "enforced"],
                ["DECISIONS", "8,491", "illustrative"],
                ["APPROVALS", "17", "pending"],
              ].map(([a, b, c]) => (
                <div className="giga-stat" key={a}>
                  <small>{a}</small><strong>{b}</strong><span>{c}</span>
                </div>
              ))}
            </div>

            <div className="giga-console-grid">
              <div className="giga-panel">
                <div className="giga-panel-title">RECENT RUNTIME DECISIONS <span>VIEW ALL ↗</span></div>
                {events.map(([time, action, agent, detail]) => (
                  <div className="giga-event" key={time}>
                    <time>{time}</time>
                    <b className={action.toLowerCase()}>{action}</b>
                    <div><strong>{agent}</strong><small>{detail}</small></div>
                  </div>
                ))}
              </div>

              <div className="giga-panel">
                <div className="giga-panel-title">POLICY HEALTH</div>
                <div className="giga-ring">
                  <div><strong>94%</strong><span>covered</span></div>
                </div>
                <div className="giga-policy-list">
                  <span>Runtime controls <b>32</b></span>
                  <span>Human approval <b>7</b></span>
                  <span>Restricted actions <b>3</b></span>
                </div>
              </div>
            </div>
            <div className="giga-console-note">Illustrative interface — values shown are examples, not customer metrics.</div>
          </div>
        </div>
      </section>

      <section className="giga-loop">
        <div className="giga-section-intro">
          <div className="giga-kicker">ONE CONTROL LOOP</div>
          <h2>From unknown agents to<br /><i>governed execution.</i></h2>
        </div>
        <div className="giga-loop-grid">
          {[
            ["01", "DISCOVER", "Find the agents operating across your organization and understand what systems and capabilities they can reach."],
            ["02", "GOVERN", "Define organizational policies in language your compliance and operations teams already use."],
            ["03", "DECIDE", "Evaluate the intended action at runtime and return an enforceable decision before execution."],
            ["04", "AUDIT", "Record what happened, why the decision was made and where human oversight entered the loop."],
          ].map(([n, title, text]) => (
            <article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p><a href="/how-it-works">LEARN MORE ↗</a></article>
          ))}
        </div>
      </section>

      <section className="giga-policy">
        <div className="giga-policy-copy">
          <div className="giga-kicker">POLICY → RUNTIME</div>
          <h2>Plain-English policy becomes an <i>enforceable control.</i></h2>
          <p>
            The important part is not writing another policy document. It is
            making the policy matter at the exact moment an agent tries to act.
          </p>
          <Link href="/policy-enforcement">EXPLORE POLICY ENFORCEMENT ↗</Link>
        </div>
        <div className="giga-flow">
          {[
            ["01", "ORGANIZATIONAL INTENT", "“High-impact HR decisions need human review.”"],
            ["02", "POLICY", "Arbyter interprets the requirement and its scope."],
            ["03", "RUNTIME CONTROL", "The relevant action is evaluated before execution."],
            ["04", "DECISION", "ALLOW / BLOCK / RESTRICT / HUMAN APPROVAL"],
            ["05", "AUDIT", "Decision context is retained for investigation."],
          ].map(([n, title, text]) => (
            <div className="giga-flow-row" key={n}><span>{n}</span><div><b>{title}</b><p>{text}</p></div></div>
          ))}
        </div>
      </section>

      <section className="giga-industries">
        <div className="giga-section-intro">
          <div className="giga-kicker">BUILT FOR THE AI WORKFORCE</div>
          <h2>Governance that follows<br /><i>the work.</i></h2>
          <p>Use the same control layer across teams, workflows and agent types without changing the organization&apos;s underlying systems.</p>
        </div>
        <div className="giga-industry-grid">
          {industries.map(([title, text]) => <article key={title}><span>ARBYTER / {title}</span><h3>{title}</h3><p>{text}</p><a href="/use-cases">EXPLORE ↗</a></article>)}
        </div>
      </section>

      <section className="giga-build">
        <div className="giga-section-intro">
          <div className="giga-kicker">BUILD / OBSERVE / IMPROVE</div>
          <h2>Operate your AI workforce<br /><i>with context.</i></h2>
        </div>
        <div className="giga-build-grid">
          {[
            ["BUILD", "Connect agents and systems", "Discover existing agents, establish identity and context, and bring different agent architectures into one governance model."],
            ["OBSERVE", "Understand what is happening", "Trace actions, decisions, approvals, policy matches and risk signals without reconstructing the story from separate systems."],
            ["IMPROVE", "Make governance operational", "Investigate failures, update controls and keep organizational intent aligned with what agents are actually allowed to do."],
          ].map(([title, sub, text]) => <article key={title}><div className="giga-build-number">{title}</div><h3>{sub}</h3><p>{text}</p><div className="giga-mini-ui"><span></span><span></span><span></span><b>{title}</b></div></article>)}
        </div>
      </section>

      <section className="giga-architecture">
        <div>
          <div className="giga-kicker">ONE GOVERNANCE LAYER</div>
          <h2>Any agent.<br />Any system.<br /><i>One control layer.</i></h2>
        </div>
        <div className="giga-architecture-map">
          <div className="giga-arch-side"><span>MCP</span><span>API</span><span>SDK</span><span>WEBHOOK</span><span>INTERNAL</span><span>CLOUD</span></div>
          <div className="giga-arch-core">ARBYTER<br /><b>GOVERN</b></div>
          <div className="giga-arch-side right"><span>POLICY</span><span>RISK</span><span>APPROVAL</span><span>AUDIT</span><span>CONTROL</span><span>DECISION</span></div>
        </div>
      </section>

      <section className="giga-cta">
        <div className="giga-kicker">INTELLIGENCE MEETS GOVERNANCE</div>
        <h2>Know what your agents can do.<br /><i>Control what they actually do.</i></h2>
        <p>See how Arbyter can fit into your AI workforce and governance model.</p>
        <Link href="/demo" className="giga-primary">BOOK YOUR SLOT</Link>
      </section>

      <footer className="giga-footer">
        <div><strong>ARBYTER<span>/OS</span></strong><p>Runtime governance for the AI workforce.</p></div>
        <div><div className="giga-footer-title">PRODUCT</div><Link href="/platform">Platform</Link><Link href="/agent-discovery">Agent Discovery</Link><Link href="/policy-enforcement">Policy Enforcement</Link><Link href="/ai-agent-security">AI Agent Security</Link></div>
        <div><div className="giga-footer-title">EXPLORE</div><Link href="/use-cases">Use Cases</Link><Link href="/resources">Resources</Link><Link href="/pricing">Pricing</Link><Link href="/how-it-works">How It Works</Link></div>
        <div><div className="giga-footer-title">CONTACT</div><Link href="/demo">Book Your Slot</Link><Link href="/sign-up">Sign Up</Link><Link href="/login">Sign In</Link></div>
        <div className="giga-footer-bottom">© 2026 ARBYTER / INTELLIGENCE MEETS GOVERNANCE</div>
      </footer>

      <style jsx>{`
        .giga-home{background:#050507;color:#f7f7f4;font-family:Georgia,"Times New Roman",serif}
        .giga-home a{color:inherit;text-decoration:none}
        .giga-announcement{max-width:1440px;margin:0 auto;padding:13px 32px;border-bottom:1px solid rgba(255,255,255,.11);display:flex;justify-content:space-between;font:9px/1.2 "Geist Mono",monospace;letter-spacing:.16em;color:rgba(255,255,255,.48)}
        .giga-hero{max-width:1240px;margin:0 auto;padding:130px 32px 120px}
        .giga-kicker{font:9px/1.4 "Geist Mono",monospace;letter-spacing:.18em;color:rgba(255,255,255,.48);text-transform:uppercase}
        .giga-hero h1{font-size:clamp(58px,8.5vw,138px);line-height:.91;letter-spacing:-.065em;font-weight:400;max-width:1100px;margin:28px 0 34px}
        .giga-hero h1 i,.giga-section-intro i,.giga-policy h2 i,.giga-architecture h2 i,.giga-cta h2 i{font-style:italic;color:#c7c5ff}
        .giga-hero>p{font-size:clamp(18px,2vw,25px);line-height:1.38;max-width:690px;color:rgba(255,255,255,.64);margin:0}
        .giga-actions{display:flex;gap:14px;align-items:center;margin-top:38px}
        .giga-primary,.giga-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 19px;font:9px "Geist Mono",monospace;letter-spacing:.14em;text-transform:uppercase}
        .giga-primary{background:#f5f5f2;color:#08080a!important}
        .giga-secondary{border:1px solid rgba(255,255,255,.16);color:rgba(255,255,255,.7)!important}
        .giga-strip{max-width:1440px;margin:0 auto;border-top:1px solid rgba(255,255,255,.12);border-bottom:1px solid rgba(255,255,255,.12);padding:22px 32px;display:flex;justify-content:space-between;font:9px "Geist Mono",monospace;letter-spacing:.16em;color:rgba(255,255,255,.45)}
        .giga-console-section,.giga-loop,.giga-industries,.giga-build{max-width:1240px;margin:0 auto;padding:140px 32px}
        .giga-section-intro{max-width:850px}
        .giga-section-intro h2{font-size:clamp(48px,6.3vw,92px);font-weight:400;line-height:.94;letter-spacing:-.055em;margin:24px 0}
        .giga-section-intro p,.giga-policy-copy p{font:17px/1.55 Arial,sans-serif;color:rgba(255,255,255,.57);max-width:640px}
        .giga-console{margin-top:70px;border:1px solid rgba(255,255,255,.13);background:#09090d;display:grid;grid-template-columns:205px 1fr;box-shadow:0 30px 100px rgba(0,0,0,.35)}
        .giga-sidebar{border-right:1px solid rgba(255,255,255,.1);padding:22px 14px;min-height:580px}
        .giga-console-logo{font:12px "Geist Mono",monospace;letter-spacing:.08em;margin:2px 8px 32px}.giga-console-logo span,.giga-footer span{color:#7974ff}
        .giga-nav-row{padding:11px 8px;font:10px "Geist Mono",monospace;color:rgba(255,255,255,.42);display:flex;gap:10px}.giga-nav-row span{color:rgba(255,255,255,.2)}.giga-nav-row.active{background:rgba(255,255,255,.07);color:#fff}
        .giga-sidebar-foot{margin:80px 8px 0;font:8px/1.6 "Geist Mono",monospace;color:rgba(255,255,255,.35)}.giga-sidebar-foot b{color:#9e9cff}
        .giga-console-main{padding:25px}
        .giga-console-head{display:flex;justify-content:space-between;align-items:flex-start}.giga-console-head small,.giga-panel-title,.giga-stat small,.giga-stat span,.giga-event time,.giga-event small,.giga-console-note{font:8px "Geist Mono",monospace;letter-spacing:.08em;color:rgba(255,255,255,.4)}.giga-console-head h3{font-size:28px;font-weight:400;margin:7px 0 0}.giga-live{font:8px "Geist Mono",monospace;color:#aaa6ff;letter-spacing:.08em}
        .giga-stats{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid rgba(255,255,255,.1);margin-top:25px}.giga-stat{padding:18px;border-right:1px solid rgba(255,255,255,.1)}.giga-stat:last-child{border-right:0}.giga-stat strong{display:block;font-size:29px;font-weight:400;margin:9px 0 4px}
        .giga-console-grid{display:grid;grid-template-columns:1.7fr 1fr;gap:14px;margin-top:14px}.giga-panel{border:1px solid rgba(255,255,255,.1);padding:18px}.giga-panel-title{display:flex;justify-content:space-between;margin-bottom:20px}.giga-event{display:grid;grid-template-columns:65px 75px 1fr;gap:8px;align-items:start;padding:13px 0;border-top:1px solid rgba(255,255,255,.08)}.giga-event b{font:8px "Geist Mono",monospace;letter-spacing:.08em}.giga-event b.allow{color:#a9d8bb}.giga-event b.block{color:#ff9898}.giga-event b.approval{color:#b9b4ff}.giga-event strong{display:block;font:10px "Geist Mono",monospace}.giga-event small{display:block;margin-top:4px}
        .giga-ring{width:130px;height:130px;border:1px solid rgba(160,156,255,.55);border-radius:50%;display:grid;place-items:center;margin:30px auto}.giga-ring div{text-align:center}.giga-ring strong{display:block;font-size:30px;font-weight:400}.giga-ring span{font:8px "Geist Mono",monospace;color:rgba(255,255,255,.4)}.giga-policy-list{border-top:1px solid rgba(255,255,255,.08)}.giga-policy-list span{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08);font:9px "Geist Mono",monospace;color:rgba(255,255,255,.5)}.giga-policy-list b{color:#fff}.giga-console-note{padding-top:12px}
        .giga-loop-grid,.giga-industry-grid,.giga-build-grid{display:grid;grid-template-columns:repeat(4,1fr);margin-top:70px;border-top:1px solid rgba(255,255,255,.12);border-left:1px solid rgba(255,255,255,.12)}.giga-loop-grid article,.giga-industry-grid article,.giga-build-grid article{padding:25px;border-right:1px solid rgba(255,255,255,.12);border-bottom:1px solid rgba(255,255,255,.12);min-height:250px}.giga-loop-grid span,.giga-build-number{font:9px "Geist Mono",monospace;color:rgba(255,255,255,.35)}.giga-loop-grid h3,.giga-industry-grid h3,.giga-build-grid h3{font-size:25px;font-weight:400;margin:55px 0 13px}.giga-loop-grid p,.giga-industry-grid p,.giga-build-grid p{font:14px/1.5 Arial,sans-serif;color:rgba(255,255,255,.5)}.giga-loop-grid a,.giga-industry-grid a{display:block;margin-top:28px;font:8px "Geist Mono",monospace;color:#aaa6ff}
        .giga-policy{border-top:1px solid rgba(255,255,255,.12);border-bottom:1px solid rgba(255,255,255,.12);display:grid;grid-template-columns:1fr 1fr;gap:80px;padding:140px max(32px,calc((100vw - 1176px)/2))}
        .giga-policy-copy h2{font-size:clamp(46px,5vw,76px);line-height:.96;font-weight:400;letter-spacing:-.05em;margin:24px 0}.giga-policy-copy>a{display:inline-block;margin-top:26px;font:9px "Geist Mono",monospace;color:#aaa6ff;letter-spacing:.1em}
        .giga-flow{border-top:1px solid rgba(255,255,255,.13)}.giga-flow-row{display:grid;grid-template-columns:45px 1fr;gap:10px;padding:20px 0;border-bottom:1px solid rgba(255,255,255,.1)}.giga-flow-row>span{font:9px "Geist Mono",monospace;color:rgba(255,255,255,.32)}.giga-flow-row b{font:9px "Geist Mono",monospace;letter-spacing:.1em}.giga-flow-row p{font:15px/1.4 Arial,sans-serif;color:rgba(255,255,255,.5);margin:7px 0 0}
        .giga-industry-grid{grid-template-columns:repeat(3,1fr)}.giga-industry-grid article{min-height:230px}.giga-industry-grid h3{margin-top:65px}
        .giga-build-grid{grid-template-columns:repeat(3,1fr)}.giga-build-grid article{min-height:420px}.giga-mini-ui{height:120px;margin-top:35px;border:1px solid rgba(255,255,255,.1);position:relative;padding:12px}.giga-mini-ui span{display:block;height:5px;background:rgba(255,255,255,.08);margin-bottom:9px}.giga-mini-ui span:nth-child(2){width:72%}.giga-mini-ui span:nth-child(3){width:45%}.giga-mini-ui b{position:absolute;right:12px;bottom:12px;font:8px "Geist Mono",monospace;color:#aaa6ff}
        .giga-architecture{max-width:1240px;margin:0 auto;padding:140px 32px;display:grid;grid-template-columns:.8fr 1.2fr;gap:80px;align-items:center}.giga-architecture h2{font-size:clamp(55px,6vw,88px);font-weight:400;line-height:.92;letter-spacing:-.06em;margin:25px 0}.giga-architecture-map{display:grid;grid-template-columns:1fr 150px 1fr;align-items:center;gap:20px}.giga-arch-side{display:grid;gap:9px}.giga-arch-side span{border:1px solid rgba(255,255,255,.12);padding:11px;font:8px "Geist Mono",monospace;color:rgba(255,255,255,.45);text-align:right}.giga-arch-side.right span{text-align:left}.giga-arch-core{height:150px;border:1px solid #7974ff;display:grid;place-items:center;text-align:center;font:11px/1.6 "Geist Mono",monospace;letter-spacing:.14em;box-shadow:0 0 50px rgba(70,65,255,.12)}.giga-arch-core b{color:#aaa6ff}
        .giga-cta{border-top:1px solid rgba(255,255,255,.12);padding:150px 32px 170px;text-align:center}.giga-cta h2{font-size:clamp(52px,7vw,105px);font-weight:400;line-height:.93;letter-spacing:-.06em;margin:24px auto 28px;max-width:1050px}.giga-cta p{font:16px/1.5 Arial,sans-serif;color:rgba(255,255,255,.5);margin-bottom:30px}
        .giga-footer{max-width:1440px;margin:0 auto;border-top:1px solid rgba(255,255,255,.12);padding:45px 32px 25px;display:grid;grid-template-columns:2fr repeat(3,1fr);gap:40px;position:relative}.giga-footer strong{font:13px "Geist Mono",monospace;letter-spacing:.08em}.giga-footer p{font:13px/1.5 Arial,sans-serif;color:rgba(255,255,255,.4);max-width:230px}.giga-footer>div:not(:first-child){display:grid;align-content:start;gap:12px}.giga-footer-title{font:8px "Geist Mono",monospace;letter-spacing:.15em;color:rgba(255,255,255,.3);margin-bottom:6px}.giga-footer a{font:12px Arial,sans-serif;color:rgba(255,255,255,.62)}.giga-footer-bottom{grid-column:1/-1;border-top:1px solid rgba(255,255,255,.08);padding-top:18px;font:8px "Geist Mono",monospace;color:rgba(255,255,255,.3);letter-spacing:.1em}
        @media(max-width:800px){.giga-announcement{padding:11px 18px}.giga-announcement span:last-child{display:none}.giga-hero,.giga-console-section,.giga-loop,.giga-industries,.giga-build,.giga-architecture{padding-left:18px;padding-right:18px}.giga-hero{padding-top:90px;padding-bottom:90px}.giga-hero h1{font-size:clamp(49px,14vw,82px)}.giga-strip{padding:18px;overflow:auto;gap:24px;justify-content:flex-start}.giga-strip span{white-space:nowrap}.giga-console{grid-template-columns:1fr}.giga-sidebar{display:none}.giga-console-main{padding:16px}.giga-stats{grid-template-columns:1fr 1fr}.giga-stat:nth-child(2){border-right:0}.giga-console-grid,.giga-policy,.giga-architecture{grid-template-columns:1fr}.giga-loop-grid,.giga-industry-grid,.giga-build-grid{grid-template-columns:1fr 1fr}.giga-loop-grid article,.giga-industry-grid article,.giga-build-grid article{min-height:240px}.giga-policy{padding:90px 18px;gap:60px}.giga-architecture{gap:55px}.giga-footer{grid-template-columns:1fr 1fr;padding-left:18px;padding-right:18px}.giga-footer>div:first-child,.giga-footer-bottom{grid-column:1/-1}}
        @media(max-width:520px){.giga-actions{align-items:stretch;flex-direction:column}.giga-primary,.giga-secondary{width:100%}.giga-loop-grid,.giga-industry-grid,.giga-build-grid{grid-template-columns:1fr}.giga-console-head{display:block}.giga-live{display:block;margin-top:15px}.giga-event{grid-template-columns:52px 65px 1fr}.giga-architecture-map{grid-template-columns:1fr;gap:12px}.giga-arch-side{grid-template-columns:1fr 1fr}.giga-arch-side span,.giga-arch-side.right span{text-align:center}.giga-arch-core{height:110px}.giga-footer{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
