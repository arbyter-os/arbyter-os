import { PageFrame } from "@/components/site/PageFrame";
import { Flow } from "@/components/site/VisualSystem";
import { ScrollStory } from "@/components/site/ScrollStory";

export default function AgentGovernance(){return <PageFrame eyebrow="AGENT GOVERNANCE / 05" title={<>Know what every<br/><em>agent can do.</em></>} intro="Governance starts with a clear model of agents, capabilities, permissions, tools, owners and the rules that constrain them.">
<ScrollStory steps={[
{eyebrow:"01 / IDENTITY",title:"Know which agent is acting.",body:"Governance begins with a clear identity and ownership model.",mode:"command"},
{eyebrow:"02 / CAPABILITY",title:"Map what it can reach.",body:"Capabilities and tools define the practical surface an agent can exercise.",mode:"discovery"},
{eyebrow:"03 / PERMISSION",title:"Define what it is allowed to do.",body:"Permissions and organizational rules narrow that capability into an approved operating boundary.",mode:"security"},
{eyebrow:"04 / ACTION",title:"Govern the moment it acts.",body:"The runtime decision connects the agent model to the action being attempted.",mode:"runtime"},
]} />
<section className="dark-section"><div className="eyebrow">AGENT GRAPH</div><h2>Agent → capability → tool → action.</h2><Flow items={["Agent identity","Capabilities","Permissions","Tool access","Runtime decision"]}/></section>
<section className="editorial-section"><div><div className="eyebrow">GOVERNANCE SURFACE</div><h2>Control without turning every team into a security team.</h2></div><p>Operations and compliance teams can define boundaries while engineering teams keep building the agents that do the work.</p></section>
</PageFrame>}