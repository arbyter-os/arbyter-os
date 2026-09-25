import { PageFrame } from "@/components/site/PageFrame";
import { Flow } from "@/components/site/VisualSystem";
import { ScrollStory } from "@/components/site/ScrollStory";

export default function EnterpriseAIGovernance(){return <PageFrame eyebrow="ENTERPRISE AI GOVERNANCE / 09" title={<>One governance model<br/><em>across the enterprise.</em></>} intro="Finance, HR, engineering, sales and operations can use different agents without creating disconnected governance systems.">
<ScrollStory steps={[
{eyebrow:"01 / MANY WORKFLOWS",title:"Every team builds differently.",body:"Finance, HR, engineering, sales, support and operations can each have different agents and tools.",mode:"discovery"},
{eyebrow:"02 / SHARED INTENT",title:"The organization still has common rules.",body:"Enterprise policy and operational intent should not disappear when execution moves between teams.",mode:"policy"},
{eyebrow:"03 / ONE BOUNDARY",title:"Governance follows the action.",body:"A shared runtime layer evaluates agent behavior against organizational boundaries.",mode:"runtime"},
{eyebrow:"04 / CONTROL",title:"Teams keep ownership. The organization keeps visibility.",body:"Central governance can define boundaries while domain teams retain their workflows and agents.",mode:"security"},
]} />
<section className="enterprise-map"><div className="enterprise-core">ARBYTER<span>GOVERNANCE LAYER</span></div>{["FINANCE","HR","ENGINEERING","SALES","OPERATIONS","SUPPORT"].map((x,i)=><div className={"enterprise-node n"+i} key={x}>{x}</div>)}</section>
<section className="editorial-section"><div><div className="eyebrow">ENTERPRISE MODEL</div><h2>Different workflows. Shared boundaries.</h2></div><p>Central governance can define organizational rules while teams retain ownership of their agents and domain workflows.</p></section>
</PageFrame>}