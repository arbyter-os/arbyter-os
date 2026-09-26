"use client";

import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";

const sections = [
  {
    eyebrow: "01 / THE WORKFORCE",
    title: "Agents are already moving.",
    text: "Research. Finance. Support. Engineering. Each one can reason, call tools and cross business boundaries.",
  },
  {
    eyebrow: "02 / THE GOVERNANCE LAYER",
    title: "The missing layer between intent and execution.",
    text: "Arbyter sits between organizations and their AI agents, turning organizational policies and intent into controls that can be enforced when agents act.",
  },
  {
    eyebrow: "03 / RUNTIME DECISION",
    title: "Every action meets a decision.",
    text: "Arbyter can allow, block, restrict, pause or require human approval before an agent action reaches the systems it can affect.",
  },
  {
    eyebrow: "04 / POLICY → RUNTIME",
    title: "Policy becomes control.",
    text: "A plain-English business or regulatory requirement becomes a runtime rule, an action-time decision and an auditable record.",
  },
  {
    eyebrow: "05 / AUDIT",
    title: "Everything leaves a trail.",
    text: "Know what happened, which agent acted, which policy applied, why the decision was made and whether a human approved it.",
  },
];

export default function Home() {
  return (
    <main className="site-page">
      <SiteNav />

      <section
        className="page-hero"
        style={{
          minHeight: "82vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div className="eyebrow">ARBYTER / RUNTIME GOVERNANCE</div>
        <h1>
          AI agents can act.
          <br />
          <em>Who decides</em> what they&apos;re allowed to do?
        </h1>
        <p>
          Arbyter is the runtime governance layer between organizations and
          their AI agents. It turns organizational intent into decisions that
          can be enforced when agents act.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 34 }}>
          <Link href="/demo" className="site-enter">
            BOOK YOUR SLOT
          </Link>
          <Link
            href="/how-it-works"
            style={{
              padding: "11px 18px",
              fontSize: 9,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              border: "1px solid rgba(255,255,255,.16)",
              borderRadius: 999,
              color: "rgba(255,255,255,.65)",
            }}
          >
            SEE HOW IT WORKS
          </Link>
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.eyebrow} className="editorial-section">
          <div>
            <div className="eyebrow">{section.eyebrow}</div>
            <h2>{section.title}</h2>
          </div>
          <p>{section.text}</p>
        </section>
      ))}

      <section
        className="page-hero"
        style={{ paddingTop: 80, paddingBottom: 170 }}
      >
        <div className="eyebrow">ARBYTER</div>
        <h2 style={{ fontSize: "clamp(54px,8vw,120px)" }}>
          Intelligence
          <br />
          <em>meets governance.</em>
        </h2>
        <Link
          href="/demo"
          className="site-enter"
          style={{ display: "inline-flex", marginTop: 35 }}
        >
          BOOK YOUR SLOT
        </Link>
      </section>
    </main>
  );
}
