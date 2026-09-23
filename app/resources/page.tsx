import { PageFrame } from "@/components/site/PageFrame";

const items = [{"name":"Runtime governance guide","body":"Understand the path from an organizational rule to an action-level decision.","tags":"guide · runtime"},{"name":"Policy enforcement guide","body":"Explore how natural-language requirements can become executable controls.","tags":"guide · policy"},{"name":"Agent discovery guide","body":"Map agents, capabilities, tools, and connections before governing their execution.","tags":"guide · discovery"},{"name":"MCP governance guide","body":"Understand governance boundaries around MCP-connected agents and tools.","tags":"guide · MCP"},{"name":"Enterprise AI governance","body":"A framework for operating an AI workforce with policy, permissions, oversight, and auditability.","tags":"enterprise · governance"},{"name":"AI agent security","body":"Connect identity, permissions, tools, destinations, and action context at runtime.","tags":"security · risk"}];

export default function Page() {
  return <PageFrame eyebrow="RESOURCES FOR GOVERNED AI" title={<>Resources for governed AI</>} intro="Practical entry points for understanding how organizational intent becomes enforceable AI agent behavior.">
    <section className="resource-system">
      <div className="resource-index">{items.map((item, i) => <article key={item.name}><span>0{i+1}</span><div><h2>{item.name}</h2><p>{item.body}</p><small>{item.tags}</small></div></article>)}</div>
    </section>
  </PageFrame>;
}