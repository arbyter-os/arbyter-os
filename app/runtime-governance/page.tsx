import { PageFrame } from "@/components/site/PageFrame";
import { RuntimeVisual } from "@/components/site/VisualSystem";

export default function RuntimeGovernance(){return <PageFrame eyebrow="RUNTIME GOVERNANCE / 03" title={<>Governance<br/><em>at execution.</em></>} intro="Static policies cannot see what an autonomous agent is about to do. Runtime governance evaluates the action where it matters: before execution.">
<section className="full-visual"><RuntimeVisual mode="runtime"/></section>
<section className="dark-section split"><div><div className="eyebrow">BEFORE THE ACTION</div><h2>Stop the wrong action before it becomes a business event.</h2></div><p>Access, tool calls, data movement, external actions and high-impact workflows can be evaluated against organizational rules.</p></section>
</PageFrame>}
