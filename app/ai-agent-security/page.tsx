import { PageFrame } from "@/components/site/PageFrame";
import { Flow } from "@/components/site/VisualSystem";
import { ScrollStory } from "@/components/site/ScrollStory";

export default function AgentSecurity(){return <PageFrame eyebrow="AI AGENT SECURITY / 08" title={<>Security follows<br/><em>the action.</em></>} intro="An agent can be trusted and still make an unsafe request. Arbyter evaluates identity, permissions, tool access and organizational policy at runtime.">
<ScrollStory steps={[
{eyebrow:"01 / IDENTITY",title:"Identify who is acting.",body:"The runtime decision starts with the agent and its authorized identity.",mode:"security"},
{eyebrow:"02 / ACCESS",title:"Check what the action can reach.",body:"Permissions and tool access define the immediate execution boundary.",mode:"discovery"},
{eyebrow:"03 / RISK",title:"Evaluate the request in context.",body:"Policy and runtime context determine whether the requested action crosses an organizational boundary.",mode:"policy"},
{eyebrow:"04 / DECISION",title:"Enforce before execution.",body:"Allow, block or require approval before the request becomes an external outcome.",mode:"runtime"},
]} />
<section className="dark-section"><div className="eyebrow">DECISION PATH</div><Flow items={["Identity","Permission","Requested action","Risk / policy","Allow / block / approve"]}/></section>
</PageFrame>}