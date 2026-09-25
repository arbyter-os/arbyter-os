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

export default function Pricing() {
  return (
    <PageFrame
      eyebrow="PRICING / GOVERN THE WORKFORCE"
      title={<>One governance layer.<br /><em>Scale with your agents.</em></>}
      intro="Arbyter pricing scales with the number of agents you govern. Start with a focused deployment and expand the governed workforce as adoption grows."
    >
      <section className="pricing-section">
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <article className="pricing-plan" key={plan.name}>
              <div className="pricing-plan-top">
                <span>0{index + 1} / {plan.agents} AGENTS</span>
                <h2>{plan.name}</h2>
              </div>
              <div className="pricing-price">{plan.price}<small>/mo</small></div>
              <p>{plan.note}</p>
              <div className="pricing-capacity">{plan.agents} governed agents</div>
            </article>
          ))}
        </div>

        <div className="pricing-explainer">
          <div>
            <span className="eyebrow">HOW CAPACITY WORKS</span>
            <h2>Discovery finds the workforce. Your plan defines how much you govern.</h2>
          </div>
          <div className="pricing-copy">
            <p>Arbyter can discover more agents than your current plan allows. If a plan covers 100 agents and discovery finds 150, you can upgrade or continue with governance applied to the capacity available on your plan.</p>
            <p>Every plan is built around the same core model: connect agents, understand their capabilities, translate organizational intent into policy, evaluate actions at runtime, and keep the decision trail.</p>
          </div>
        </div>


        <section className="pricing-faq">
          <div>
            <span className="eyebrow">PRICING / QUESTIONS</span>
            <h2>Designed for the workforce you have now, not the one you might have later.</h2>
          </div>
          <div className="pricing-faq-list">
            <article><h3>What happens if discovery finds more agents than my plan?</h3><p>You can upgrade to a higher capacity or continue within the agent capacity available on your plan. Discovery does not require you to manually add every agent one at a time.</p></article>
            <article><h3>Does every plan use the same governance model?</h3><p>The core model remains consistent: connect agents, define organizational intent, enforce policy at runtime and retain the decision trail. Capacity scales with the number of governed agents.</p></article>
            <article><h3>What counts as a governed agent?</h3><p>An agent is part of the governed workforce when it is connected to Arbyter and included in the organization’s runtime governance boundary.</p></article>
          </div>
        </section>
        <div className="pricing-flow" aria-label="Arbyter pricing and governance flow">
          <span>DISCOVER</span><i>→</i><span>CONNECT</span><i>→</i><span>GOVERN</span><i>→</i><span>ENFORCE</span><i>→</i><span>AUDIT</span>
        </div>
      </section>
    </PageFrame>
  );
}
