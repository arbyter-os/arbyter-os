"use client";

import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import "./giga-home.css";

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
    </main>
  );
}
