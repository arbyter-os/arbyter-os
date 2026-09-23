import { PageFrame } from "@/components/site/PageFrame";
import { Flow } from "@/components/site/VisualSystem";
import { ScrollStory } from "@/components/site/ScrollStory";

export default function PolicyEnforcement(){return <PageFrame eyebrow="POLICY ENFORCEMENT / 04" title={<>Words become<br/><em>runtime rules.</em></>} intro="Write the rule in the language your organization already uses. Arbyter turns the intent into an enforceable decision path.">
<ScrollStory steps={[
{eyebrow:"01 / HUMAN POLICY",title:"“High-impact HR decisions require human review.”",body:"The organization starts with a business requirement, not a technical configuration.",mode:"command"},
{eyebrow:"02 / INTERPRET",title:"Arbyter maps the requirement.",body:"The policy becomes a condition that can be evaluated against an agent's real action.",mode:"policy"},
{eyebrow:"03 / RUNTIME RULE",title:"The control waits at the boundary.",body:"The rule is present when the governed action is attempted, not only inside a policy document.",mode:"runtime"},
{eyebrow:"04 / OUTCOME",title:"Review happens before execution.",body:"Arbyter can require approval, block the action, or allow it when the policy conditions are satisfied.",mode:"security"},
]} />
<section className="process-section"><Flow items={["Human language","Interpretation","Executable control","Agent action","Approval / block","Audit"]}/></section>
</PageFrame>}