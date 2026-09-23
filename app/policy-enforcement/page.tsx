import { PageFrame } from "@/components/site/PageFrame";
import { RuntimeVisual, Flow } from "@/components/site/VisualSystem";
import { ScrollStory } from "@/components/site/ScrollStory";

export default function PolicyEnforcement(){return <PageFrame eyebrow="POLICY ENFORCEMENT / 04" title={<>Words become<br/><em>runtime rules.</em></>} intro="Write the rule in the language your organization already uses. Arbyter turns the intent into an enforceable decision path.">
<section className="visual-section"><RuntimeVisual mode="policy"/><div className="visual-copy"><div className="eyebrow">POLICY → CONTROL</div><h2>“High-impact HR decisions require human review.”</h2><p>Arbyter can translate that requirement into a runtime checkpoint instead of leaving it as a document nobody can enforce.</p></div></section>
<section className="process-section"><Flow items={["Human language","Interpretation","Executable control","Agent action","Approval / block","Audit"]}/></section>
</PageFrame>}
