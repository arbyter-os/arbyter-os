import { PageFrame } from "@/components/site/PageFrame";
import { Flow } from "@/components/site/VisualSystem";
import { ScrollStory } from "@/components/site/ScrollStory";

export default function HowItWorks(){return <PageFrame eyebrow="HOW IT WORKS / 02" title={<>From policy<br/><em>to runtime.</em></>} intro="Arbyter sits in the execution path. A business rule becomes a decision that can be enforced before an agent action becomes an outcome.">
<ScrollStory steps={[
{eyebrow:"01 / INTENT",title:"Start with what the organization wants.",body:"Business intent and operational requirements establish the boundary before an agent begins acting.",mode:"command"},
{eyebrow:"02 / POLICY",title:"Turn intent into a rule.",body:"Arbyter connects organizational language to a concrete runtime control.",mode:"policy"},
{eyebrow:"03 / EXECUTION",title:"Evaluate the action in context.",body:"Identity, capability, tool, destination and policy meet at the moment of execution.",mode:"runtime"},
{eyebrow:"04 / DECISION",title:"Allow. Block. Or ask.",body:"The result is an enforceable decision, with human approval where the rule requires it.",mode:"security"},
]} />
<section className="process-section"><Flow items={["Intent","Policy","Evaluation","Allow / Block / Approve","Audit"]}/></section>
</PageFrame>}