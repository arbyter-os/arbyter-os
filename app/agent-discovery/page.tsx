import { PageFrame } from "@/components/site/PageFrame";
import { Flow } from "@/components/site/VisualSystem";
import { ScrollStory } from "@/components/site/ScrollStory";

export default function AgentDiscovery(){return <PageFrame eyebrow="AGENT DISCOVERY / 06" title={<>Find the workforce<br/><em>you didn't know existed.</em></>} intro="Discover agents and agent-like systems across APIs, MCP, cloud environments, internal infrastructure and AI platforms before governance becomes a guessing game.">
<ScrollStory steps={[
{eyebrow:"01 / ENVIRONMENT",title:"Start where the enterprise already connects.",body:"MCP servers, API gateways, cloud environments, internal servers and AI platforms form the discovery surface.",mode:"discovery"},
{eyebrow:"02 / DISCOVER",title:"Find agents and agent-like systems.",body:"Arbyter turns scattered connections into a model of the systems that can act.",mode:"runtime"},
{eyebrow:"03 / CLASSIFY",title:"Understand what each system can do.",body:"Identity, capabilities, tools and connection context make the workforce legible.",mode:"command"},
{eyebrow:"04 / GOVERN",title:"Move from inventory to control.",body:"Discovered systems become part of the same governance model instead of another spreadsheet.",mode:"security"},
]} />
<section className="process-section"><Flow items={["Enterprise environment","Discovery","Classification","Connection","Governance"]}/></section>
</PageFrame>}