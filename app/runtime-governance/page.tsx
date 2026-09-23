import { PageFrame } from "@/components/site/PageFrame";
import { Flow } from "@/components/site/VisualSystem";
import { ScrollStory } from "@/components/site/ScrollStory";

export default function RuntimeGovernance(){return <PageFrame eyebrow="RUNTIME GOVERNANCE / 03" title={<>Governance<br/><em>at execution.</em></>} intro="Static policies cannot see what an autonomous agent is about to do. Runtime governance evaluates the action where it matters: before execution.">
<ScrollStory steps={[
{eyebrow:"01 / REQUEST",title:"An agent decides to act.",body:"A model reaches the point where reasoning becomes a real tool call, data movement or business action.",mode:"command"},
{eyebrow:"02 / CONTEXT",title:"Arbyter sees the action.",body:"The decision is evaluated with identity, permissions, tools, destination, policy and runtime context.",mode:"runtime"},
{eyebrow:"03 / GOVERNANCE",title:"The boundary is enforced.",body:"A rule can permit execution, stop it, or pause the workflow for human review.",mode:"security"},
{eyebrow:"04 / RECORD",title:"The decision becomes auditable.",body:"The governed action and its outcome can be recorded as part of the organizational control trail.",mode:"policy"},
]} />
<section className="dark-section split"><div><div className="eyebrow">RUNTIME DECISION</div><h2>Stop the wrong action before it becomes a business event.</h2></div><p>Access, tool calls, data movement, external actions and high-impact workflows can be evaluated against organizational rules.</p></section>
<section className="process-section"><Flow items={["Agent request","Context","Policy evaluation","Allow / Block / Approve","Audit"]}/></section>
</PageFrame>}