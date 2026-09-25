import { PageFrame } from "@/components/site/PageFrame";
import { RuntimeVisual, Flow } from "@/components/site/VisualSystem";

export default function AgentCommand(){return <PageFrame eyebrow="AI AGENT COMMAND / 07" title={<>Tell Arbyter what<br/><em>should happen.</em></>} intro="Natural language and voice can become the command surface for an AI workforce. Arbyter interprets intent, finds the relevant agents and surfaces conflicts before applying a change.">
<section className="visual-section"><RuntimeVisual mode="command"/><div className="visual-copy"><div className="eyebrow">INTENT AS INTERFACE</div><h2>“Use the finance agents for this. Block external data access.”</h2><p>Arbyter can turn a human instruction into a governed action plan, with suggested agents, controls and risks.</p></div></section>
<section className="dark-section"><div className="eyebrow">COMMAND LOOP</div><Flow items={["Voice / text","Intent","Agents","Controls","Confirmation"]}/></section>
</PageFrame>}
