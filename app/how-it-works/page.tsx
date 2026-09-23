import { PageFrame } from "@/components/site/PageFrame";
import { RuntimeVisual, Flow } from "@/components/site/VisualSystem";

export default function HowItWorks(){return <PageFrame eyebrow="HOW IT WORKS / 02" title={<>From policy<br/><em>to runtime.</em></>} intro="Arbyter sits in the execution path. A business rule becomes a decision that can be enforced before an agent action becomes an outcome.">
<section className="visual-section"><RuntimeVisual/><div className="visual-copy"><div className="eyebrow">THE LOOP</div><h2>Understand. Evaluate. Decide. Record.</h2><p>Every governed action moves through a consistent loop, with human approval when policy requires it.</p></div></section>
<section className="process-section"><Flow items={["Intent","Policy","Evaluation","Allow / Block / Approve","Audit"]}/></section>
</PageFrame>}
