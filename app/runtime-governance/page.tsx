import { PageFrame } from "@/components/site/PageFrame";
import { Flow } from "@/components/site/VisualSystem";
import { ScrollStory } from "@/components/site/ScrollStory";

export default function RuntimeGovernance(){return <PageFrame eyebrow="RUNTIME GOVERNANCE / 03" title={<>Governance<br/><em>at execution.</em></>} intro="Static policies cannot see what an autonomous agent is about to do. Runtime governance evaluates the action where it matters: before execution.">
<RuntimeEnforcement />
<section className="dark-section split"><div><div className="eyebrow">RUNTIME DECISION</div><h2>Stop the wrong action before it becomes a business event.</h2></div><p>Access, tool calls, data movement, external actions and high-impact workflows can be evaluated against organizational rules.</p></section>
<section className="process-section"><Flow items={["Agent request","Context","Policy evaluation","Allow / Block / Approve","Audit"]}/></section>
</PageFrame>}