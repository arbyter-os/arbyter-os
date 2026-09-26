import { PageFrame } from "@/components/site/PageFrame";

const plans = [
  { name: "Starter", agents: "1–10", price: "$79", note: "For a focused AI agent deployment." },
  { name: "Pro", agents: "10–25", price: "$249", note: "For growing governed agent teams." },
  { name: "Pro Plus", agents: "25–50", price: "$499", note: "For broader operational coverage." },
  { name: "Enterprise", agents: "50–100", price: "$999", note: "For organization-wide governance." },
  { name: "Enterprise Plus", agents: "100–200", price: "$1,999", note: "For larger multi-team workforces." },
  { name: "Enterprise Pro", agents: "200–500", price: "$4,999", note: "For high-scale enterprise deployments." },
  { name: "Enterprise Pro Plus", agents: "500–1,000", price: "$8,999", note: "For large autonomous workforces." },
  { name: "Boss", agents: "1,000+", price: "$8,999", note: "$10 per agent over 1,000." },
];

const details = [
  ["WHAT SCALES","Agent capacity","Pricing is organized around the number of governed agents. The same governance model can be applied as the workforce expands."],
  ["DISCOVERY","Find before you scale","Discovery can identify more agents than a plan currently governs. Teams can use that visibility to understand capacity and decide when to expand."],
  ["GOVERNANCE","One operating model","Every tier is built around the same core sequence: connect, understand, define policy, evaluate at runtime and retain the decision trail."],
  ["RUNTIME","Control actions","Governance is applied to actions rather than simply displaying a dashboard. Policies can produce allow, block, restrict, pause or approval decisions."],
  ["APPROVAL","Human oversight","Where an organization's policy requires a person, the runtime flow can pause for human approval rather than silently continuing."],
  ["AUDIT","Keep the evidence","The governance record connects the agent, action, context, policy and decision so teams can investigate what happened."],
  ["GROWTH","Start focused","A smaller deployment can begin with a specific workflow or team and expand as more agents enter production."],
  ["ENTERPRISE","Scale the boundary","Larger workforces need consistent governance across many owners, systems and agent types. Capacity tiers are designed around that expansion."],
];

export default function Pricing() {
  return (
    <PageFrame eyebrow="PRICING / GOVERN THE WORKFORCE" title={<>One governance layer.<br /><em>Scale with your agents.</em></>} intro="Arbyter pricing scales with the number of agents you govern. Start with a focused deployment and expand the governed workforce as adoption grows.">
      <section className="pricing-section">
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <article className="pricing-plan" key={plan.name}>
              <div className="pricing-plan-top"><span>0{index + 1} / {plan.agents} AGENTS</span><h2>{plan.name}</h2></div>
              <div className="pricing-price">{plan.price}<small>/mo</small></div>
              <p>{plan.note}</p>
              <div className="pricing-capacity">{plan.agents} governed agents</div>
            </article>
          ))}
        </div>
        <div className="concept-depth">
          {details.map(([eyebrow,title,body]) => <article key={title}><span>{eyebrow}</span><h3>{title}</h3><p>{body}</p></article>)}
        </div>
        <section className="pricing-explainer">
          <div><span className="eyebrow">CAPACITY MODEL</span><h2>Discovery finds the workforce. Your plan defines the governed capacity.</h2></div>
          <div className="pricing-copy"><p>Arbyter can discover more agents than your current plan allows. If discovery finds 150 agents while the selected capacity is 100, the organization can expand its capacity rather than manually rebuilding its governance model.</p><p>The important distinction is between visibility and governed capacity. Discovery helps you understand the workforce; the plan defines how many agents are covered by the selected capacity.</p><p>Pricing and commercial terms can evolve as the product matures. The page is designed so capacity, governance scope and plan information remain easy to understand.</p></div>
        </section>
        <section className="pricing-faq">
          <div><span className="eyebrow">PRICING / QUESTIONS</span><h2>Choose capacity around the workforce you actually need to govern.</h2></div>
          <div className="pricing-faq-list">
            <article><h3>What happens if discovery finds more agents than my plan?</h3><p>You can expand capacity. Discovery remains useful because it shows the gap between the workforce that exists and the capacity currently governed.</p></article>
            <article><h3>Does every plan use the same governance model?</h3><p>The core model remains consistent: connect agents, define organizational intent, enforce policy at runtime and retain the decision trail.</p></article>
            <article><h3>What counts as a governed agent?</h3><p>An agent is governed when it is connected to Arbyter and included within the organization's runtime governance boundary.</p></article>
            <article><h3>Can an organization start small?</h3><p>Yes. The tiers are structured so a focused deployment can begin with a smaller workforce and expand as adoption grows.</p></article>
          </div>
        </section>
      </section>
    </PageFrame>
  );
}