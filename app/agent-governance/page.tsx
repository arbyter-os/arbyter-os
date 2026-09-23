import { PageFrame } from "@/components/site/PageFrame";
import { Flow } from "@/components/site/VisualSystem";
import { ScrollStory } from "@/components/site/ScrollStory";

export default function AgentGovernance(){return <PageFrame eyebrow="AGENT GOVERNANCE / 05" title={<>Know what every<br/><em>agent can do.</em></>} intro="Governance starts with a clear model of agents, capabilities, permissions, tools, owners and the rules that constrain them.">
<section className="dark-section"><div className="eyebrow">AGENT GRAPH</div><h2>Agent → capability → tool → action.</h2><Flow items={["Agent identity","Capabilities","Permissions","Tool access","Runtime decision"]}/></section>
<section className="editorial-section"><div><div className="eyebrow">GOVERNANCE SURFACE</div><h2>Control without turning every team into a security team.</h2></div><p>Operations and compliance teams can define boundaries while engineering teams keep building the agents that do the work.</p></section>
</PageFrame>}
