import { PageFrame } from "@/components/site/PageFrame";
import { Flow } from "@/components/site/VisualSystem";

export default function EnterpriseAIGovernance(){return <PageFrame eyebrow="ENTERPRISE AI GOVERNANCE / 09" title={<>One governance model<br/><em>across the enterprise.</em></>} intro="Finance, HR, engineering, sales and operations can use different agents without creating disconnected governance systems.">
<section className="enterprise-map"><div className="enterprise-core">ARBYTER<span>GOVERNANCE LAYER</span></div>{["FINANCE","HR","ENGINEERING","SALES","OPERATIONS","SUPPORT"].map((x,i)=><div className={"enterprise-node n"+i} key={x}>{x}</div>)}</section>
<section className="editorial-section"><div><div className="eyebrow">ENTERPRISE MODEL</div><h2>Different workflows. Shared boundaries.</h2></div><p>Central governance can define organizational rules while teams retain ownership of their agents and domain workflows.</p></section>
</PageFrame>}
