import { PageFrame } from "@/components/site/PageFrame";
import { Reveal } from "@/components/site/Reveal";

const sources = ["MCP SERVERS","API GATEWAYS","AWS","AZURE","GCP","INTERNAL SERVERS","AI PLATFORMS","APPLICATIONS"];

export default function AgentDiscovery(){return <PageFrame eyebrow="AGENT DISCOVERY / 06" title={<>Find the workforce<br/><em>you didn't know existed.</em></>} intro="Discover agents and agent-like systems across APIs, MCP, cloud environments, internal infrastructure and AI platforms before governance becomes a guessing game.">
<section className="intelligence-stack"><Reveal><div className="knowledge-plane"><div className="knowledge-ring"/><div className="knowledge-ring r2"/><div className="knowledge-core">DISCOVERY<br/>ENGINE<span>ARBYTER</span></div>{sources.map((s,i)=><div key={s} className={\`knowledge-node k\${i % 6}\`}>{s}</div>)}</div></Reveal></section>
<section className="dark-section split"><Reveal><div><div className="eyebrow">DISCOVER → CLASSIFY → GOVERN</div><h2>Start with the environment, not a spreadsheet.</h2></div></Reveal><Reveal><p>Arbyter can map discovered systems, classify their connection type and establish a path toward governed onboarding. Discovery is designed to reduce the friction of adding agents one by one.</p></Reveal></section>
<section className="process-section"><Reveal><div className="eyebrow">DISCOVERY PIPELINE</div><div className="flow">{["Enterprise environment","Discovery","Classification","Connection","Verification","Governance"].map((x,i)=><div className="flow-node" key={x}><span>0{i+1}</span><strong>{x}</strong>{i<5&&<i/>}</div>)}</div></Reveal></section>
</PageFrame>}