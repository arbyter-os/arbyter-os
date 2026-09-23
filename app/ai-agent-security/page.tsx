import { PageFrame } from "@/components/site/PageFrame";
import { RuntimeVisual, Flow } from "@/components/site/VisualSystem";
import { ScrollStory } from "@/components/site/ScrollStory";

export default function AgentSecurity(){return <PageFrame eyebrow="AI AGENT SECURITY / 08" title={<>Security follows<br/><em>the action.</em></>} intro="An agent can be trusted and still make an unsafe request. Arbyter evaluates identity, permissions, tool access and organizational policy at runtime.">
<section className="full-visual"><RuntimeVisual mode="security"/></section>
<section className="dark-section"><div className="eyebrow">DECISION PATH</div><Flow items={["Identity","Permission","Requested action","Risk / policy","Allow / block / approve"]}/></section>
</PageFrame>}
