import { PageFrame } from "@/components/site/PageFrame";
import { RuntimeVisual, Flow } from "@/components/site/VisualSystem";
import { DecisionEngine } from "@/components/site/DecisionEngine";
import { Reveal } from "@/components/site/Reveal";

export default function Platform(){return <PageFrame eyebrow="PLATFORM / 01" title={<>The layer between<br/><em>intent and action.</em></>} intro="Arbyter gives organizations a runtime boundary for AI agents: discover them, understand what they can do, translate policy into controls, and decide what happens when they act.">
<section className="visual-section"><Reveal><RuntimeVisual/></Reveal><Reveal className="visual-copy"><div className="eyebrow">THE CONTROL PLANE</div><h2>Policy is only useful when it can reach runtime.</h2><p>Arbyter connects organizational intent to the moment an agent requests a tool, accesses data, or executes an action.</p></Reveal></section>
<section className="dark-section"><Reveal><div className="eyebrow">THE DECISION LAYER</div><h2>One system that can<br/><em>see the action.</em></h2></Reveal></section>
<Reveal><DecisionEngine/></Reveal>
<section className="process-section"><div className="eyebrow">ONE SYSTEM / MANY AGENTS</div><Flow items={["Organization","Arbyter","AI agents","APIs / MCP / tools"]}/></section>
</PageFrame>}