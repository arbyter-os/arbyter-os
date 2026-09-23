import { PageFrame } from "@/components/site/PageFrame";
import { RuntimeVisual, Flow } from "@/components/site/VisualSystem";

export default function AgentDiscovery(){return <PageFrame eyebrow="AGENT DISCOVERY / 06" title={<>Find the workforce<br/><em>you didn't know existed.</em></>} intro="Discover agents and agent-like systems across APIs, MCP, cloud environments, internal infrastructure and AI platforms before governance becomes a guessing game.">
<section className="visual-section"><RuntimeVisual mode="discovery"/><div className="visual-copy"><div className="eyebrow">DISCOVER → CLASSIFY → GOVERN</div><h2>Start with the environment, not a spreadsheet.</h2><p>Arbyter maps what is connected, what each system can do, and where governance should begin.</p></div></section>
<section className="process-section"><Flow items={["Enterprise environment","Discovery","Classification","Connection","Governance"]}/></section>
</PageFrame>}
