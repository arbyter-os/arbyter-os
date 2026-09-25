import { PageFrame } from "@/components/site/PageFrame";

const items = [{"name":"AI agent governance","body":"The organizational controls, permissions, policies, and oversight applied to AI agents and their actions.","tags":"governance · agents"},{"name":"Runtime governance","body":"Evaluating an agent action at execution time and deciding whether it can proceed.","tags":"runtime · enforcement"},{"name":"Policy enforcement","body":"Turning organizational intent into rules that can change an agent's execution path.","tags":"policy · rules"},{"name":"Human-in-the-loop","body":"A runtime control that pauses a governed action and routes it to a person for review.","tags":"approval · oversight"},{"name":"Agent discovery","body":"Finding agents and their connections across APIs, MCP, cloud systems, internal services, and platforms.","tags":"discovery · inventory"},{"name":"MCP governance","body":"Applying governance controls to agents and tools connected through the Model Context Protocol.","tags":"MCP · tools"},{"name":"AI control plane","body":"A centralized layer for coordinating governance and control across an organization's AI workforce.","tags":"control plane · operations"},{"name":"Audit trail","body":"Evidence connecting an action to its agent, context, governing policy, decision, and outcome.","tags":"audit · evidence"}];

export default function Page() {
  return <PageFrame eyebrow="THE ARBYTER GLOSSARY" title={<>The Arbyter glossary</>} intro="A machine-readable vocabulary for AI agent governance, runtime enforcement, security, compliance, and enterprise AI operations.">
    <section className="resource-system">
      <div className="resource-index">{items.map((item, i) => <article key={item.name}><span>0{i+1}</span><div><h2>{item.name}</h2><p>{item.body}</p><small>{item.tags}</small></div></article>)}</div>
    </section>
  </PageFrame>;
}