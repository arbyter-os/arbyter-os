import { PageFrame } from "@/components/site/PageFrame";
import { RuntimeVisual, Flow } from "@/components/site/VisualSystem";
import { Reveal } from "@/components/site/Reveal";

export default function RuntimeGovernance(){return <PageFrame eyebrow="RUNTIME GOVERNANCE / 03" title={<>Governance<br/><em>at execution.</em></>} intro="Static policies describe what should happen. Runtime governance evaluates what an agent is actually attempting to do, at the point of execution.">
<section className="full-visual"><Reveal><RuntimeVisual mode="runtime"/></Reveal></section>
<section className="dark-section split"><Reveal><div><div className="eyebrow">BEFORE THE ACTION</div><h2>Stop the wrong action before it becomes a business event.</h2></div></Reveal><Reveal><p>Access, tool calls, data movement, external actions and high-impact workflows can be evaluated against organizational rules before the agent proceeds.</p></Reveal></section>
<section className="process-section"><div className="eyebrow">RUNTIME DECISION</div><Flow items={["Agent requests","Context gathered","Policy evaluated","Allow / block / approve","Audit event"]}/></section>
</PageFrame>}