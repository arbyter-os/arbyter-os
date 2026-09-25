import { PageFrame } from "@/components/site/PageFrame";
import { RuntimeVisual, Flow } from "@/components/site/VisualSystem";
import { PlatformStory } from "@/components/site/PlatformStory";

export default function Platform(){return <PageFrame eyebrow="PLATFORM / 01" title={<>The layer between<br/><em>intent and action.</em></>} intro="Arbyter gives organizations a runtime boundary for AI agents: discover them, understand what they can do, translate policy into controls, and decide what happens when they act.">
<PlatformStory />
<section className="dark-section"><div className="eyebrow">ONE SYSTEM / MANY AGENTS</div><h2>Different agents.<br/>One boundary.</h2><Flow items={["Organization","Arbyter","AI agents","APIs / MCP / tools"]}/></section>
</PageFrame>}
