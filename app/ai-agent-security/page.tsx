import { PageFrame } from "@/components/site/PageFrame";
import { RuntimeVisual, Flow } from "@/components/site/VisualSystem";
import { Reveal } from "@/components/site/Reveal";

export default function AgentSecurity(){return <PageFrame eyebrow="AI AGENT SECURITY / 08" title={<>Security follows<br/><em>the action.</em></>} intro="An agent can be trusted and still make an unsafe request. Arbyter evaluates identity, permissions, tool access and organizational policy at runtime.">
<section className="full-visual"><Reveal><RuntimeVisual mode="security"/></Reveal></section>
<section className="dark-section split"><Reveal><div><div className="eyebrow">CONTEXTUAL SECURITY</div><h2>Trust is not a permanent permission.</h2></div></Reveal><Reveal><p>The relevant question is what this identity is attempting to do, with which tool, against which resource, under which organizational rule.</p></Reveal></section>
<section className="process-section"><Reveal><div className="eyebrow">DECISION PATH</div><Flow items={["Identity","Permission","Requested action","Risk / policy","Allow / block / approve"]}/></Reveal></section>
</PageFrame>