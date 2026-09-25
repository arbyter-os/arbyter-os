import { PageFrame } from "@/components/site/PageFrame";

const items = [{"name":"MCP","body":"Govern agents and tools connected through MCP endpoints and supported transport patterns.","tags":"MCP · tools"},{"name":"APIs","body":"Connect REST and API-based agents with authentication and action-level governance.","tags":"API · REST"},{"name":"Webhooks","body":"Bring event-driven agents and workflows into the governed execution boundary.","tags":"webhooks · events"},{"name":"SDK","body":"Integrate agent applications through a programmatic connection path.","tags":"SDK · integration"},{"name":"Internal agents","body":"Govern agents built inside the organization alongside third-party and platform agents.","tags":"internal · enterprise"},{"name":"AI platforms","body":"Map agents across AI platforms and connect their capabilities to organizational controls.","tags":"platforms · discovery"}];

export default function Page() {
  return <PageFrame eyebrow="CONNECT THE AI WORKFORCE YOU ALREADY HAVE" title={<>Connect the AI workforce you already have</>} intro="Arbyter is designed as a governance layer around existing agents and the systems they use.">
    <section className="resource-system">
      <div className="resource-index">{items.map((item, i) => <article key={item.name}><span>0{i+1}</span><div><h2>{item.name}</h2><p>{item.body}</p><small>{item.tags}</small></div></article>)}</div>
    </section>
  </PageFrame>;
}